import { NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
  try {
    const firstPageData = await PokemonRepository.getPokemonsFirstPage();
    return NextResponse.json({
      success: true,
      data: firstPageData,
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
