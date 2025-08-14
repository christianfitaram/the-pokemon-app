import { NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
  const maxRetries = 20; // Set a reasonable limit
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const pokemon = await PokemonRepository.getRandomPokemon();
      if (pokemon) {
        return NextResponse.json(pokemon);
      }
    } catch (error) {
      console.error("Error fetching random pokemon:", error);
    }
    attempt++;
  }

  // If we reach here, all attempts failed
  return NextResponse.json(
    { message: "No pokemon found after multiple attempts" },
    { status: 500 }
  );
}
