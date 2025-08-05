import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
  try {
    const getPokemonsFirstPage = await PokemonRepository.gePokemonsFirstPage();
    return NextResponse.json(getPokemonsFirstPage);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
