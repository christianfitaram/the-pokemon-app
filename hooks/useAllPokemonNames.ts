import { useEffect, useState } from "react";
import { Pokemon, PokemonListResponse, ApiResponse } from "@/types/interfaces";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export function useAllPokemonNames() {
    const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("allPokemonNames");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPokemonNames(Array.isArray(parsed) ? parsed : []);
                setLoading(false);
            } catch (error) {
                console.error("Error parsing stored Pokemon names:", error);
                setPokemonNames([]);
                setLoading(false);
            }
        } else {
            PokemonApiClient.getAllPokemons()
                .then((response: ApiResponse<PokemonListResponse>) => {
                    if (response.success && response.data) {
                        const pokemonData = response.data?.results || [];
                        localStorage.setItem("allPokemonNames", JSON.stringify(pokemonData));
                        setPokemonNames(pokemonData);
                    } else {
                        console.error("Invalid response format:", response);
                        setPokemonNames([]);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching Pokemon names:", error);
                    setPokemonNames([]);
                })
                .finally(() => setLoading(false));
        }
    }, []);

    return { pokemonNames, loading };
}
