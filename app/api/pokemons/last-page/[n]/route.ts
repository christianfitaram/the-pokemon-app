import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET(req: NextRequest, { params }: any) {
  const { n } = params;

  try {
    const response = await PokemonRepository.gePokemonsLastPage(n);
    let pokemonDetails = response;
    console.log(response);
    if (response.results.length === 0 && response.previous) {
      console.log("response");

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
