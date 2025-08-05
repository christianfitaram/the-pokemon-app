// app/hooks/useAllPokemonNames.ts
import { useEffect, useState } from "react";
import { Pokemon } from "@/types/types";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export function useAllPokemonNames() {
  const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("allPokemonNames");
    if (stored) {
      setPokemonNames(JSON.parse(stored));
      setLoading(false);
    } else {
      PokemonApiClient.getAllPokemons()
        .then((response) => {
          if (response.success && Array.isArray(response)) {
            localStorage.setItem("allPokemonNames", JSON.stringify(response));
            setPokemonNames(response);
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);
  return { pokemonNames, loading };
}