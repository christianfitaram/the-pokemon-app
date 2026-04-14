"use client"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export default function Page() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const getRandomPokemon = async () => {
      setError(null);
      try {
        const request = await PokemonApiClient.getRandomPokemon();

        if (!request.success || !request.data?.name) {
          console.error("Failed to get random pokemon:", request.error);
          if (!isCancelled) {
            setError("Could not load a random Pokemon right now.");
          }
          return;
        }

        if (!isCancelled) {
          router.push(`/pokemon/${request.data.name.toLowerCase()}`);
        }
      } catch (error) {
        console.error("Error fetching random pokemon:", error);
        if (!isCancelled) {
          setError("Network error while finding a random Pokemon.");
        }
      }
    };

    getRandomPokemon();
    return () => {
      isCancelled = true;
    };
  }, [router, retryNonce]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Random Pokemon failed</h1>
          <p className="text-gray-300">{error}</p>
          <div className="flex flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
            <Link
              href="/"
              className="border border-gray-400 text-gray-100 px-4 py-2 rounded hover:bg-gray-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Finding a random Pokémon...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
