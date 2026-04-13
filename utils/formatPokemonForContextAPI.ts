type GenericRecord = Record<string, unknown>;

type PokemonContextPayload = {
    name?: string;
    height_dm?: number;
    weight_hg?: number;
    types?: string[];
    abilities?: unknown;
    stats?: unknown;
    color?: string;
    habitat?: string;
    description?: string;
    image?: string;
    evolution_chain?: string[];
    evolution_tree?: GenericRecord;
};

function asRecord(value: unknown): GenericRecord | null {
    return value && typeof value === "object" ? (value as GenericRecord) : null;
}

function asString(value: unknown, fallback = "unknown"): string {
    return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function normalizeAbilities(abilities: unknown): string[] {
    if (!Array.isArray(abilities)) return [];
    return abilities
        .map((ability) => {
            if (typeof ability === "string") return ability;
            const record = asRecord(ability);
            if (!record) return null;
            if (typeof record.name === "string") return record.name;

            const nested = asRecord(record.ability);
            return typeof nested?.name === "string" ? nested.name : null;
        })
        .filter((ability): ability is string => Boolean(ability));
}

function normalizeStats(stats: unknown): Record<string, number> {
    if (!Array.isArray(stats)) {
        return asRecord(stats) as Record<string, number> || {};
    }

    return Object.fromEntries(
        stats
            .map((entry) => {
                const record = asRecord(entry);
                if (!record) return [null, null] as const;
                const nestedStat = asRecord(record.stat);
                const key = asString(record.name ?? nestedStat?.name, "");
                const value = Number(record.value ?? record.base_stat);
                return [key, value] as const;
            })
            .filter(([key, value]) => Boolean(key) && Number.isFinite(value))
    );
}

function renderEvolutionTree(node: GenericRecord, depth = 0): string {
    const indent = "  ".repeat(depth);
    const children = Array.isArray(node.evolves_to) ? node.evolves_to : [];
    const lines = [`${indent}- ${asString(node.name)}`];
    for (const child of children) {
        const childRecord = asRecord(child);
        if (childRecord) {
            lines.push(renderEvolutionTree(childRecord, depth + 1));
        }
    }
    return lines.join("\n");
}

export default function formatPokemonForContext(pokemon: unknown): string {
    const payload = (asRecord(pokemon) || {}) as PokemonContextPayload;
    const normalizedAbilities = normalizeAbilities(payload.abilities);
    const normalizedStats = normalizeStats(payload.stats);

    const statLines = Object.entries(normalizedStats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

    const types = Array.isArray(payload.types) ? payload.types : [];
    let output = `
Name: ${asString(payload.name)}
Height: ${typeof payload.height_dm === "number" ? `${(payload.height_dm / 10).toFixed(1)} m` : "unknown"}
Weight: ${typeof payload.weight_hg === "number" ? `${(payload.weight_hg / 10).toFixed(1)} kg` : "unknown"}
Types: ${types.join(", ")}
Abilities: ${normalizedAbilities.join(", ")}
Color: ${asString(payload.color)}
Habitat: ${asString(payload.habitat)}
Stats: ${statLines}
Description: ${asString(payload.description)}
Image URL: ${asString(payload.image)}
`.trim();

    if (Array.isArray(payload.evolution_chain) && payload.evolution_chain.length > 0) {
        output += `\nEvolution Chain: ${payload.evolution_chain.join(" -> ")}`;
    }

    if (payload.evolution_tree) {
        output += `\nEvolution Tree:\n${renderEvolutionTree(payload.evolution_tree)}`;
    }

    return output;
}
