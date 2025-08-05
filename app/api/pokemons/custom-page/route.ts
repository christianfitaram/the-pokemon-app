import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    const pokemonDetails = await PokemonRepository.gePokemonsCustomPage(url);
    return NextResponse.json(pokemonDetails);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
