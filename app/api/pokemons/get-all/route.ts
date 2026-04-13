import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

const MAX_LIMIT = 1302;
const SEARCH_DEFAULT_LIMIT = 30;
const FULL_LIST_LIMIT = 1302;

function normalizeLimit(raw: string | null, hasQuery: boolean): number {
    if (!raw) return hasQuery ? SEARCH_DEFAULT_LIMIT : FULL_LIST_LIMIT;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) return hasQuery ? SEARCH_DEFAULT_LIMIT : FULL_LIST_LIMIT;
    return Math.min(parsed, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
    try {
        const response = await PokemonRepository.getAllPokemons();
        const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() || "";
        const limit = normalizeLimit(req.nextUrl.searchParams.get("limit"), Boolean(query));

        const filtered = query
            ? response.results.filter((pokemon) => pokemon.name.includes(query))
            : response.results;

        // Transform the response to match our API structure
        return NextResponse.json({
            success: true,
            data: filtered.slice(0, limit)
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
