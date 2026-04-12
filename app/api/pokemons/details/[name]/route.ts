import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET(req: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;

  try {
    const pokemonDetails = await PokemonRepository.getPokemonByName(name);
    return NextResponse.json({
      success: true,
      data: pokemonDetails,
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
