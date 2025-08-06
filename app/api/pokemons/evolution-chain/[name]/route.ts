// app/api/pokemons/details/[name]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET(req: NextRequest, { params }: any) {
  const { name } = await params;


  try {
    const url = await PokemonRepository.getEvolutionChainURL(name);
    const dataEvo = await PokemonRepository.getEvolutionChainData(url)
    return NextResponse.json(dataEvo);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
