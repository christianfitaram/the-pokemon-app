"use client"
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export default function Page() {
  const router = useRouter();
  const hasExecuted = useRef(false);

  useEffect(() => {
    // Only execute once
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const getRandomPokemon = async () => {
      try {
        const request = await PokemonApiClient.getRandomPokemon();
        
        if (!request.success || !request.data?.name) {
          console.error("Failed to get random pokemon:", request.error);
          return;
        }

        router.push(`/pokemon/${request.data.name.toLowerCase()}`);
      } catch (error) {
        console.error("Error fetching random pokemon:", error);
      }
    };

    getRandomPokemon();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Finding a random Pokémon...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
