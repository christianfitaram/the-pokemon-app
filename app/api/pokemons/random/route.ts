import { NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
  try {
    const pokemon = await PokemonRepository.getRandomPokemon();
    return NextResponse.json({
      success: true,
      data: pokemon,
    });
  } catch (error) {
    console.error("Error fetching random pokemon:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
