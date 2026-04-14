import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";
import { Pokemon } from "@/types/interfaces";

const MAX_LIMIT = 1302;
const SEARCH_DEFAULT_LIMIT = 30;
const FULL_LIST_LIMIT = 1302;
const ALL_POKEMON_CACHE_TTL_MS = 5 * 60 * 1000;

let allPokemonCache: { results: Pokemon[]; expiresAt: number } | null = null;

function normalizeLimit(raw: string | null, hasQuery: boolean): number {
    if (!raw) return hasQuery ? SEARCH_DEFAULT_LIMIT : FULL_LIST_LIMIT;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) return hasQuery ? SEARCH_DEFAULT_LIMIT : FULL_LIST_LIMIT;
    return Math.min(parsed, MAX_LIMIT);
}

async function getAllPokemonResultsCached(): Promise<Pokemon[]> {
    const now = Date.now();
    if (allPokemonCache && now < allPokemonCache.expiresAt) {
        return allPokemonCache.results;
    }

    const response = await PokemonRepository.getAllPokemons();
    allPokemonCache = {
        results: response.results,
        expiresAt: now + ALL_POKEMON_CACHE_TTL_MS,
    };
    return response.results;
}

export async function GET(req: NextRequest) {
    try {
        const results = await getAllPokemonResultsCached();
        const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() || "";
        const limit = normalizeLimit(req.nextUrl.searchParams.get("limit"), Boolean(query));

        const filtered = query
            ? results.filter((pokemon) => pokemon.name.includes(query))
            : results;
        const page = filtered.slice(0, limit);
        const hydratedPage = query
            ? await PokemonRepository.hydratePokemonCards(page, 8)
            : page;

        // Transform the response to match our API structure
        return NextResponse.json({
            success: true,
            data: hydratedPage
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
