import { NextRequest, NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawOffset = body?.offset;
    const rawLimit = body?.limit;
    const offset = Number(rawOffset);
    const limit = Number(rawLimit ?? 24);

    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid offset provided" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid limit provided" },
        { status: 400 }
      );
    }

    const pokemonDetails = await PokemonRepository.getPokemonsCustomPage(offset, limit);
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
