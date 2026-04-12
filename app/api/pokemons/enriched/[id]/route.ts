import { NextRequest, NextResponse } from "next/server";
import { connectRedis } from "@/lib/redis";
import { EnrichedEvolutionNode, EnrichedPokemonAbility, EnrichedPokemonData, EnrichedPokemonEncounter, EnrichedPokemonMove } from "@/types/enrichedPokemon";
import { z } from "zod";

const BASE_URL = "https://pokeapi.co/api/v2";

const TTL = {
    pokemon: { fresh: 60 * 60 * 12, stale: 60 * 60 * 24 * 7 },
    species: { fresh: 60 * 60 * 24, stale: 60 * 60 * 24 * 7 },
    evolution: { fresh: 60 * 60 * 24, stale: 60 * 60 * 24 * 7 },
    ability: { fresh: 60 * 60 * 24, stale: 60 * 60 * 24 * 7 },
    encounters: { fresh: 60 * 60 * 6, stale: 60 * 60 * 24 },
    aggregate: { fresh: 60 * 15, stale: 60 * 60 * 12 },
} as const;

type CacheState = "fresh-cache" | "stale-cache" | "origin";

type CacheEnvelope<T> = {
    data: T;
    updatedAt: number;
};

type MaybeNamedResource = {
    name?: string;
    url?: string;
};

const NamedResourceSchema = z.object({
    name: z.string(),
    url: z.string().optional(),
});

const PokemonSchema = z.object({
    id: z.number(),
    name: z.string(),
    height: z.number(),
    weight: z.number(),
    base_experience: z.number(),
    types: z.array(z.object({ type: NamedResourceSchema })),
    sprites: z.object({
        front_default: z.string().nullable().optional(),
        other: z.object({
            "official-artwork": z.object({
                front_default: z.string().nullable().optional(),
            }).passthrough().optional(),
        }).passthrough().optional(),
    }).passthrough(),
    stats: z.array(z.object({
        stat: NamedResourceSchema,
        base_stat: z.number(),
        effort: z.number(),
    })),
    moves: z.array(z.object({
        move: z.object({ name: z.string(), url: z.string() }),
        version_group_details: z.array(z.object({
            move_learn_method: z.object({ name: z.string() }).passthrough(),
            level_learned_at: z.number(),
        })).optional(),
    })),
    abilities: z.array(z.object({
        ability: z.object({ name: z.string(), url: z.string() }),
        is_hidden: z.boolean(),
        slot: z.number(),
    })),
});

const SpeciesSchema = z.object({
    evolution_chain: z.object({ url: z.string() }),
    genera: z.array(z.object({
        genus: z.string(),
        language: z.object({ name: z.string() }),
    })),
    flavor_text_entries: z.array(z.object({
        flavor_text: z.string(),
        language: z.object({ name: z.string() }),
    })),
    habitat: NamedResourceSchema.nullable().optional(),
    shape: NamedResourceSchema.nullable().optional(),
    color: z.object({ name: z.string() }),
    capture_rate: z.number(),
    base_happiness: z.number(),
    growth_rate: z.object({ name: z.string() }),
    egg_groups: z.array(NamedResourceSchema),
    gender_rate: z.number(),
    is_legendary: z.boolean(),
    is_mythical: z.boolean(),
});

const EvolutionResponseSchema = z.object({
    chain: z.object({
        species: NamedResourceSchema,
    }).passthrough(),
});

const AbilitySchema = z.object({
    name: z.string(),
    effect_entries: z.array(z.object({
        effect: z.string(),
        short_effect: z.string(),
        language: z.object({ name: z.string() }),
    })),
});

const EncountersSchema = z.array(z.object({
    location_area: z.object({ name: z.string() }),
    version_details: z.array(z.object({
        version: z.object({ name: z.string() }),
    })),
}));

function sanitizeId(input: string): number | null {
    const parsed = Number(input);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
}

function getIdFromUrl(url?: string | null): number | null {
    if (!url) return null;
    const matched = url.match(/\/(\d+)\/?$/);
    return matched ? Number(matched[1]) : null;
}

function asName(resource?: MaybeNamedResource | null): string | null {
    return resource?.name ?? null;
}

function pickEnglishEntry<T extends { language?: MaybeNamedResource }>(entries: T[]): T | null {
    return entries.find((entry) => entry.language?.name === "en") ?? entries[0] ?? null;
}

function cleanFlavorText(value: string): string {
    return value.replace(/\f|\n/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url} (${response.status})`);
    }
    return response.json() as Promise<T>;
}

function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown, label: string): T {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
        throw new Error(`${label} payload validation failed`);
    }
    return parsed.data;
}

async function withSWRCache<T>(
    key: string,
    freshTtlSec: number,
    staleTtlSec: number,
    fetcher: () => Promise<T>
): Promise<{ data: T; state: CacheState }> {
    const redis = await connectRedis();
    const now = Date.now();

    const cachedRaw = await redis.get(key);
    if (cachedRaw) {
        try {
            const cached = JSON.parse(cachedRaw) as CacheEnvelope<T>;
            const ageSec = Math.floor((now - cached.updatedAt) / 1000);

            if (ageSec <= freshTtlSec) {
                return { data: cached.data, state: "fresh-cache" };
            }

            if (ageSec <= staleTtlSec) {
                const lockKey = `${key}:refresh-lock`;
                const lock = await redis.set(lockKey, "1", { EX: 30, NX: true });

                if (lock) {
                    void fetcher()
                        .then(async (newData) => {
                            const envelope: CacheEnvelope<T> = {
                                data: newData,
                                updatedAt: Date.now(),
                            };
                            await redis.set(key, JSON.stringify(envelope), { EX: staleTtlSec });
                        })
                        .catch((error) => {
                            console.warn("Background refresh failed", error);
                        });
                }

                return { data: cached.data, state: "stale-cache" };
            }
        } catch {
            // Ignore malformed cache and continue with source fetch.
        }
    }

    const data = await fetcher();
    const envelope: CacheEnvelope<T> = { data, updatedAt: now };
    await redis.set(key, JSON.stringify(envelope), { EX: staleTtlSec });

    return { data, state: "origin" };
}

function normalizeMoves(moves: z.infer<typeof PokemonSchema>["moves"]): EnrichedPokemonMove[] {
    return moves
        .map((entry) => {
            const latest = entry.version_group_details?.at(-1);
            return {
                name: entry.move?.name ?? "unknown",
                url: entry.move?.url ?? "",
                learnMethod: latest?.move_learn_method?.name ?? "unknown",
                levelLearnedAt: latest?.level_learned_at ?? 0,
            };
        })
        .filter((move) => move.url)
        .slice(0, 20);
}

function normalizeEvolutionChain(chain: unknown): EnrichedEvolutionNode[] {
    if (!chain) return [];

    const nodes: EnrichedEvolutionNode[] = [];

    function walk(node: Record<string, unknown>): void {
        const evolutionDetails = Array.isArray(node.evolution_details)
            ? (node.evolution_details[0] as Record<string, unknown> | undefined)
            : undefined;
        const details = evolutionDetails ?? null;
        const species = (node.species as Record<string, unknown> | undefined) ?? {};
        const evolvesTo = Array.isArray(node.evolves_to) ? node.evolves_to : [];

        nodes.push({
            speciesName: typeof species.name === "string" ? species.name : "unknown",
            speciesUrl: typeof species.url === "string" ? species.url : "",
            evolvesTo: evolvesTo.map((evo) => {
                const evoSpecies = (evo as Record<string, unknown>)?.species as Record<string, unknown> | undefined;
                return typeof evoSpecies?.name === "string" ? evoSpecies.name : "unknown";
            }),
            minLevel: typeof details?.min_level === "number" ? details.min_level : null,
            trigger: asName((details?.trigger as MaybeNamedResource | undefined) ?? null),
            item: asName((details?.item as MaybeNamedResource | undefined) ?? null),
            timeOfDay: typeof details?.time_of_day === "string" ? details.time_of_day : null,
            needsTrade: Boolean(details?.trade_species),
            heldItem: asName((details?.held_item as MaybeNamedResource | undefined) ?? null),
        });

        for (const child of evolvesTo) {
            if (child && typeof child === "object") {
                walk(child as Record<string, unknown>);
            }
        }
    }

    if (chain && typeof chain === "object") {
        walk(chain as Record<string, unknown>);
    }
    return nodes;
}

function normalizeEncounters(encounters: z.infer<typeof EncountersSchema>): EnrichedPokemonEncounter[] {
    return encounters.map((entry) => ({
        location: entry.location_area.name,
        versions: entry.version_details.map((v) => v.version.name).filter(Boolean),
    }));
}

async function getEnrichedPokemon(id: number, includeEncounters: boolean): Promise<EnrichedPokemonData> {
    const [pokemonResult, speciesResult] = await Promise.all([
        withSWRCache(
            `pokeapi:enriched:pokemon:${id}`,
            TTL.pokemon.fresh,
            TTL.pokemon.stale,
            () => fetchJson<unknown>(`${BASE_URL}/pokemon/${id}`)
        ),
        withSWRCache(
            `pokeapi:enriched:species:${id}`,
            TTL.species.fresh,
            TTL.species.stale,
            () => fetchJson<unknown>(`${BASE_URL}/pokemon-species/${id}`)
        ),
    ]);

    const pokemon = parseOrThrow(PokemonSchema, pokemonResult.data, "pokemon");
    const species = parseOrThrow(SpeciesSchema, speciesResult.data, "species");

    const abilityUrls: string[] = pokemon.abilities.map((a) => a.ability.url);

    const [evolutionResult, abilities, encounters] = await Promise.all([
        withSWRCache(
            `pokeapi:enriched:evolution:${id}`,
            TTL.evolution.fresh,
            TTL.evolution.stale,
            () => fetchJson<unknown>(species.evolution_chain.url)
        ),
        Promise.all(
            abilityUrls.map((url) =>
                withSWRCache(
                    `pokeapi:enriched:ability:${getIdFromUrl(url) ?? url}`,
                    TTL.ability.fresh,
                    TTL.ability.stale,
                    () => fetchJson<unknown>(url)
                ).then((entry) => entry.data)
            )
        ),
        includeEncounters
            ? withSWRCache(
                `pokeapi:enriched:encounters:${id}`,
                TTL.encounters.fresh,
                TTL.encounters.stale,
                () => fetchJson<unknown>(`${BASE_URL}/pokemon/${id}/encounters`)
            ).then((entry) => entry.data)
            : Promise.resolve(undefined),
    ]);

    const evolution = parseOrThrow(EvolutionResponseSchema, evolutionResult.data, "evolution");
    const validatedAbilities = abilities.map((ability, index) =>
        parseOrThrow(AbilitySchema, ability, `ability-${index}`)
    );
    const validatedEncounters = encounters
        ? parseOrThrow(EncountersSchema, encounters, "encounters")
        : undefined;

    const genus = pickEnglishEntry<{ language?: MaybeNamedResource; genus?: string }>(species.genera ?? [])?.genus ?? "";
    const flavorTextRaw = pickEnglishEntry<{ language?: MaybeNamedResource; flavor_text?: string }>(
        species.flavor_text_entries ?? []
    )?.flavor_text ?? "";

    const abilityEffectsByName = new Map<string, EnrichedPokemonAbility>();
    for (const ability of validatedAbilities) {
        const effectEntry = pickEnglishEntry<{ language?: MaybeNamedResource; effect?: string; short_effect?: string }>(
            ability.effect_entries ?? []
        );
        abilityEffectsByName.set(ability.name, {
            name: ability.name,
            isHidden: false,
            slot: 0,
            effect: effectEntry?.effect ?? "",
            shortEffect: effectEntry?.short_effect ?? "",
        });
    }

    const normalizedAbilities: EnrichedPokemonAbility[] = pokemon.abilities.map((entry) => {
        const name = entry.ability.name;
        const details = abilityEffectsByName.get(name);
        return {
            name,
            isHidden: entry.is_hidden,
            slot: entry.slot,
            effect: details?.effect ?? "",
            shortEffect: details?.shortEffect ?? "",
        };
    });

    return {
        id: pokemon.id,
        name: pokemon.name,
        height: pokemon.height,
        weight: pokemon.weight,
        baseExperience: pokemon.base_experience,
        types: pokemon.types.map((t) => t.type.name),
        sprites: {
            frontDefault: pokemon.sprites?.front_default ?? null,
            artworkDefault: pokemon.sprites?.other?.["official-artwork"]?.front_default ?? null,
        },
        stats: pokemon.stats.map((stat) => ({
            name: stat.stat.name,
            base: stat.base_stat,
            effort: stat.effort,
        })),
        moves: normalizeMoves(pokemon.moves),
        abilities: normalizedAbilities,
        species: {
            genus,
            flavorText: cleanFlavorText(flavorTextRaw),
            habitat: asName(species.habitat),
            shape: asName(species.shape),
            color: species.color.name,
            captureRate: species.capture_rate,
            baseHappiness: species.base_happiness,
            growthRate: species.growth_rate.name,
            eggGroups: species.egg_groups.map((group) => group.name),
            genderRate: species.gender_rate,
            isLegendary: species.is_legendary,
            isMythical: species.is_mythical,
        },
        evolution: {
            chainId: getIdFromUrl(species.evolution_chain.url),
            nodes: normalizeEvolutionChain(evolution.chain),
        },
        encounters: validatedEncounters ? normalizeEncounters(validatedEncounters) : undefined,
    };
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: rawId } = await context.params;
    const id = sanitizeId(rawId);

    if (!id) {
        return NextResponse.json(
            { success: false, error: "Pokemon id must be a positive integer" },
            { status: 400 }
        );
    }

    const includeEncounters = request.nextUrl.searchParams.get("includeEncounters") === "true";
    const aggregateKey = `pokeapi:enriched:aggregate:${id}:encounters:${includeEncounters ? 1 : 0}`;

    try {
        const aggregated = await withSWRCache(
            aggregateKey,
            TTL.aggregate.fresh,
            TTL.aggregate.stale,
            () => getEnrichedPokemon(id, includeEncounters)
        );

        return NextResponse.json({
            success: true,
            data: aggregated.data,
            meta: {
                cache: aggregated.state,
                includeEncounters,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
