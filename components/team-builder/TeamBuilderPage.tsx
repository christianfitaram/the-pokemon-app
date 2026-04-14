"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaDownload, FaExclamationTriangle, FaSearch, FaTrash, FaUsers } from "react-icons/fa";
import { MainLayout } from "@/components/layout/GeneralLayout";
import { useAllPokemonNames } from "@/hooks/useAllPokemonNames";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import { Pokemon, PokemonDetails } from "@/types/interfaces";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";
import { typeAverageColor, typeGradients } from "@/utils/typeColors";
import { EnrichedPokemonData } from "@/types/enrichedPokemon";

type TeamMember = {
    id: number;
    name: string;
    artwork: string;
    types: string[];
    baseExperience: number;
    stats: Record<string, number>;
};

type TeamDraft = {
    teamName: string;
    members: TeamMember[];
};

const STORAGE_KEY = "pokemon-team-builder-draft";
const MAX_TEAM_SIZE = 6;

function extractPokemonId(pokemon: Pokemon): number | null {
    if (typeof pokemon.id === "number" && Number.isInteger(pokemon.id) && pokemon.id > 0) {
        return pokemon.id;
    }
    if (!pokemon.url) return null;
    const match = pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildFallbackStats(details: PokemonDetails): Record<string, number> {
    return {
        hp: Math.max(1, Math.round(details.base_experience / 3)),
        attack: Math.max(1, Math.round(details.base_experience / 4)),
        defense: Math.max(1, Math.round(details.base_experience / 4)),
        specialAttack: Math.max(1, Math.round(details.base_experience / 4)),
        specialDefense: Math.max(1, Math.round(details.base_experience / 4)),
        speed: Math.max(1, Math.round(details.base_experience / 4)),
    };
}

function buildStatsMap(enriched?: EnrichedPokemonData, details?: PokemonDetails): Record<string, number> {
    if (enriched?.stats?.length) {
        const stats = Object.fromEntries(enriched.stats.map((stat) => [stat.name, stat.base]));
        return {
            hp: stats.hp ?? 0,
            attack: stats.attack ?? 0,
            defense: stats.defense ?? 0,
            specialAttack: stats["special-attack"] ?? 0,
            specialDefense: stats["special-defense"] ?? 0,
            speed: stats.speed ?? 0,
        };
    }

    return details ? buildFallbackStats(details) : { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
}

function getArtwork(details?: PokemonDetails, enriched?: EnrichedPokemonData) {
    return enriched?.sprites.artworkDefault || details?.sprites.other["official-artwork"].front_default || details?.sprites.front_default || "/sprites/question-mark.png";
}

function loadDraft(): TeamDraft {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { teamName: "My Dream Team", members: [] };
        const parsed = JSON.parse(raw) as Partial<TeamDraft>;
        return {
            teamName: typeof parsed.teamName === "string" && parsed.teamName.trim() ? parsed.teamName : "My Dream Team",
            members: Array.isArray(parsed.members) ? parsed.members : [],
        };
    } catch {
        return { teamName: "My Dream Team", members: [] };
    }
}

export default function TeamBuilderPage() {
    const [teamName, setTeamName] = useState("My Dream Team");
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [loadingName, setLoadingName] = useState<string | null>(null);

    const { pokemonNames, loading: searchLoading } = useAllPokemonNames(searchQuery);

    useEffect(() => {
        const draft = loadDraft();
        setTeamName(draft.teamName);
        setMembers(draft.members);
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ teamName, members }));
    }, [teamName, members, isReady]);

    const totalStats = useMemo(() => {
        return members.reduce(
            (accumulator, member) => {
                accumulator.hp += member.stats.hp;
                accumulator.attack += member.stats.attack;
                accumulator.defense += member.stats.defense;
                accumulator.specialAttack += member.stats.specialAttack;
                accumulator.specialDefense += member.stats.specialDefense;
                accumulator.speed += member.stats.speed;
                return accumulator;
            },
            { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
        );
    }, [members]);

    const averageStats = useMemo(() => {
        const size = members.length || 1;
        return {
            hp: Math.round(totalStats.hp / size),
            attack: Math.round(totalStats.attack / size),
            defense: Math.round(totalStats.defense / size),
            specialAttack: Math.round(totalStats.specialAttack / size),
            specialDefense: Math.round(totalStats.specialDefense / size),
            speed: Math.round(totalStats.speed / size),
        };
    }, [members.length, totalStats]);

    const typeCounts = useMemo(() => {
        const counts = new Map<string, number>();
        members.forEach((member) => {
            member.types.forEach((type) => {
                counts.set(type, (counts.get(type) ?? 0) + 1);
            });
        });
        return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
    }, [members]);

    const duplicateTypes = useMemo(() => typeCounts.filter(([, count]) => count > 1), [typeCounts]);

    const suggestedPokemons = pokemonNames.slice(0, 12);

    const addPokemon = async (pokemon: Pokemon) => {
        const pokemonId = extractPokemonId(pokemon);
        if (!pokemonId) {
            setStatusMessage("Could not resolve that Pokémon's ID.");
            return;
        }

        if (members.some((member) => member.id === pokemonId)) {
            setStatusMessage(`${capitalizeFirstLetter(pokemon.name)} is already on the team.`);
            return;
        }

        if (members.length >= MAX_TEAM_SIZE) {
            setStatusMessage("Your team is full. Remove one member before adding another.");
            return;
        }

        setLoadingName(pokemon.name);
        setStatusMessage(null);

        const detailsResponse = await PokemonApiClient.getPokemonByName(pokemon.name);
        if (!detailsResponse.success || !detailsResponse.data) {
            setStatusMessage(detailsResponse.error || "Failed to load Pokémon details.");
            setLoadingName(null);
            return;
        }

        const details = detailsResponse.data;
        const enrichedResponse = await PokemonApiClient.getEnrichedPokemonById(details.id);
        const enriched = enrichedResponse.success ? enrichedResponse.data : null;

        const nextMember: TeamMember = {
            id: details.id,
            name: details.name,
            artwork: getArtwork(details, enriched ?? undefined),
            types: details.types.map((entry) => entry.type.name),
            baseExperience: details.base_experience,
            stats: buildStatsMap(enriched ?? undefined, details),
        };

        setMembers((current) => [...current, nextMember]);
        setSearchQuery("");
        setStatusMessage(`${capitalizeFirstLetter(details.name)} added to ${teamName}.`);
        setLoadingName(null);
    };

    const renderStat = (label: string, value: number) => (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
    );

    const exportTeam = () => {
        const payload = JSON.stringify({ teamName, members, exportedAt: new Date().toISOString() }, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pokemon-team"}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setStatusMessage("Team exported as JSON.");
    };

    const clearTeam = () => {
        setMembers([]);
        setStatusMessage("Team cleared.");
    };

    return (
        <MainLayout>
            <main className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-8">
                <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Recruiter-ready feature</p>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Team Builder</h1>
                        <p className="max-w-3xl text-slate-300">
                            Assemble a six-Pokémon team, inspect coverage, and keep your draft saved locally. This is the standout feature that turns the app from a browser into a product.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/pokedex/1" className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:bg-white/10">
                            Back to Pokédex
                        </Link>
                        <button type="button" onClick={exportTeam} className="rounded-full bg-sky-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-sky-300">
                            <span className="inline-flex items-center gap-2"><FaDownload /> Export JSON</span>
                        </button>
                    </div>
                </div>

                {statusMessage && (
                    <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-950/40 px-4 py-3 text-sky-100 shadow-lg">
                        {statusMessage}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                    <section className="space-y-5 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Search and add</p>
                                <h2 className="mt-1 text-2xl font-semibold text-white">Build your roster</h2>
                            </div>
                            <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
                                {members.length}/{MAX_TEAM_SIZE}
                            </div>
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-sm text-slate-300">Team name</span>
                            <input
                                value={teamName}
                                onChange={(event) => setTeamName(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 focus:border-sky-400"
                                placeholder="My Dream Team"
                            />
                        </label>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                                <FaSearch /> Search Pokémon to add
                            </label>
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
                                placeholder="Type at least 2 letters..."
                            />
                            <div className="mt-4 space-y-2">
                                {searchLoading && searchQuery.trim().length >= 2 && (
                                    <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">Searching Pokémon...</div>
                                )}
                                {!searchLoading && searchQuery.trim().length >= 2 && suggestedPokemons.length === 0 && (
                                    <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-400">No Pokémon found for that query.</div>
                                )}
                                {suggestedPokemons.map((pokemon) => {
                                    const isSelected = members.some((member) => member.name === pokemon.name);
                                    const primaryType = pokemon.types?.[0]?.type?.name || "normal";
                                    const gradient = typeGradients[primaryType] || typeGradients.normal;
                                    return (
                                        <button
                                            key={pokemon.name}
                                            type="button"
                                            onClick={() => addPokemon(pokemon)}
                                            disabled={isSelected || members.length >= MAX_TEAM_SIZE || loadingName === pokemon.name}
                                            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-left transition hover:border-sky-400/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} p-1`}>
                                                <Image
                                                    src={pokemon.url ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${extractPokemonId(pokemon) ?? 1}.png` : "/sprites/question-mark.png"}
                                                    alt={pokemon.name}
                                                    width={56}
                                                    height={56}
                                                    className="h-12 w-12 object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-white">{capitalizeFirstLetter(pokemon.name)}</p>
                                                <p className="text-sm text-slate-400">Tap to add to the team</p>
                                            </div>
                                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                                                {isSelected ? "Added" : loadingName === pokemon.name ? "Loading..." : "Add"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Draft state</p>
                                <p className="mt-2 text-sm text-white">Auto-saved in local storage.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Type spread</p>
                                <p className="mt-2 text-sm text-white">See duplicates in the right panel.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Recruiter signal</p>
                                <p className="mt-2 text-sm text-white">Shows state, reuse, and product design.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Your team</p>
                                <h2 className="mt-1 text-2xl font-semibold text-white">{teamName}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={clearTeam}
                                className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                            >
                                Clear team
                            </button>
                        </div>

                        {members.length === 0 ? (
                            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center">
                                <FaUsers className="text-4xl text-sky-300" />
                                <h3 className="mt-4 text-xl font-semibold text-white">No Pokémon added yet</h3>
                                <p className="mt-2 max-w-md text-sm text-slate-400">Search above and add up to six Pokémon to see coverage, average stats, and team synergy.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {members.map((member) => {
                                        const primaryType = member.types[0] || "normal";
                                        const gradient = typeGradients[primaryType] || typeGradients.normal;
                                        return (
                                            <motion.article
                                                key={member.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                                            >
                                                <div className={`flex items-center justify-between bg-gradient-to-r ${gradient} px-4 py-3`}>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-[0.25em] text-white/80">#{member.id}</p>
                                                        <h3 className="text-lg font-semibold text-white">{capitalizeFirstLetter(member.name)}</h3>
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        setMembers((current) => current.filter((candidate) => candidate.id !== member.id));
                                                        setStatusMessage("Team member removed.");
                                                    }} className="rounded-full bg-black/20 p-2 text-white transition hover:bg-black/40" aria-label={`Remove ${member.name}`}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4 p-4">
                                                    <Image src={member.artwork} alt={member.name} width={96} height={96} className="h-20 w-20 object-contain" />
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {member.types.map((type) => (
                                                                <span key={type} className={`rounded-full px-3 py-1 text-xs font-medium text-white ${typeAverageColor[type] || "bg-slate-700"}`}>
                                                                    {capitalizeFirstLetter(type)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm text-slate-300">Base EXP: {member.baseExperience}</p>
                                                    </div>
                                                </div>
                                            </motion.article>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                                    {renderStat("HP", averageStats.hp)}
                                    {renderStat("Atk", averageStats.attack)}
                                    {renderStat("Def", averageStats.defense)}
                                    {renderStat("Sp. Atk", averageStats.specialAttack)}
                                    {renderStat("Sp. Def", averageStats.specialDefense)}
                                    {renderStat("Speed", averageStats.speed)}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Type coverage</p>
                                            <h3 className="mt-1 text-lg font-semibold text-white">What your team leans on</h3>
                                        </div>
                                        {duplicateTypes.length > 0 && (
                                            <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                                                <FaExclamationTriangle />
                                                {duplicateTypes.length} repeated type{duplicateTypes.length === 1 ? "" : "s"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {typeCounts.length === 0 ? (
                                            <p className="text-sm text-slate-400">No type coverage yet.</p>
                                        ) : (
                                            typeCounts.map(([type, count]) => (
                                                <span key={type} className={`rounded-full px-3 py-1 text-sm text-white ${typeAverageColor[type] || "bg-slate-700"}`}>
                                                    {capitalizeFirstLetter(type)} x{count}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </MainLayout>
    );
}
