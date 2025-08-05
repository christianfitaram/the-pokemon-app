import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET(req: NextRequest, { params }: any) {
  const { type } = params;

  try {
    const pokemonsByType = await PokemonRepository.getPokemonsByType(type);
    return NextResponse.json(pokemonsByType);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
