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
        
        if (!request.success) {
          console.error("Failed to get random pokemon:", request.error);
          return;
        }
        
        const name = request.data?.name;
        
        // If name is null or undefined, try again (but only once more)
        if (!name) {
          console.log("No name received, trying one more time...");
          const retryRequest = await PokemonApiClient.getRandomPokemon();
          if (retryRequest.success && retryRequest.data?.name) {
            console.log("Navigating to:", retryRequest.data.name);
            router.push(`/pokemon/${retryRequest.data.name.toLowerCase()}`);
          } else {
            console.error("Failed to get pokemon name after retry");
          }
          return;
        }
        
        // Success! Navigate to the pokemon
        console.log("Navigating to:", name);
        router.push(`/pokemon/${name.toLowerCase()}`);
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
