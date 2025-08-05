import { NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
  try {
    const pokemons = await PokemonRepository.getAllPokemons();
    // Return only the results array
    return NextResponse.json(pokemons.results);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
