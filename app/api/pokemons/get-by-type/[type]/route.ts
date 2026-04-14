import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  try {
    const pokemonsByType = await PokemonRepository.getPokemonsByType(type);
    const hydratedPokemonsByType = await PokemonRepository.hydratePokemonCards(pokemonsByType, 8);
    return NextResponse.json({
      success: true,
      data: hydratedPokemonsByType,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
