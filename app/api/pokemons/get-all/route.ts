import { NextResponse } from "next/server";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

export async function GET() {
    try {
        const response = await PokemonRepository.getAllPokemons();
        // Transform the response to match our API structure
        return NextResponse.json({
            success: true,
            data: response.results // Extract the results array from PokemonListResponse
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
