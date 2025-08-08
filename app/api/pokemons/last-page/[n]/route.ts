import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";
import {PokemonListResponse} from "@/types/interfaces";

export async function GET(req: NextRequest, { params }: any) {
  const { n } = await params;

  try {
    const response : PokemonListResponse = await PokemonRepository.gePokemonsLastPage(n);
    let pokemonDetails = response;
    if (response.results.length === 0 && response.previous) {
      pokemonDetails = await PokemonRepository.gePokemonsCustomPage(
        response.previous
      );
    }
    return NextResponse.json(pokemonDetails);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
