import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";
import {PokemonListResponse} from "@/types/interfaces";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ n: string }> }
) {
  const { n } = await params;

  try {
    const response : PokemonListResponse = await PokemonRepository.gePokemonsLastPage(n);
    let pokemonDetails = response;
    if (response.results.length === 0 && response.previous) {
      const parsed = new URL(response.previous);
      const offset = Number(parsed.searchParams.get("offset") ?? 0);
      const limit = Number(parsed.searchParams.get("limit") ?? 24);
      pokemonDetails = await PokemonRepository.gePokemonsCustomPage(offset, limit);
    }
    return NextResponse.json(pokemonDetails);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
