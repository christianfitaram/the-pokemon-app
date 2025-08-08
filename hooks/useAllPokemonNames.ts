import { useEffect, useState } from "react";
import { Pokemon, PokemonListResponse, ApiResponse } from "@/types/interfaces";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export function useAllPokemonNames() {
    const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("allPokemonNames");
        // console.log("Initial localStorage check:", stored ? "Data found" : "No data");

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
               /* console.log("Parsed data structure:", {
                    type: typeof parsed,
                    isArray: Array.isArray(parsed)
                });
                */
                // Handle both formats: array and object with results
                const names = Array.isArray(parsed) ? parsed : parsed.results || [];
                // console.log("Extracted names length:", names.length);
                setPokemonNames(names);
                setLoading(false);
            } catch (error) {
                // console.error("Parse error:", error);
                localStorage.removeItem("allPokemonNames");
                setPokemonNames([]);
                setLoading(false);
            }
        } else {
            // console.log("Fetching from API...");
            PokemonApiClient.getAllPokemons()
                .then((response: ApiResponse<PokemonListResponse>) => {
                    if (response.success && response.data) {
                        const pokemonData = response.data.results || [];
                        try {
                            // Store just the array in development
                            localStorage.setItem("allPokemonNames", JSON.stringify(pokemonData));
                            // console.log("Successfully stored in localStorage");
                        } catch (e) {
                            console.error("Storage error:", e);
                        }
                        setPokemonNames(pokemonData);
                    } else {
                        // console.error("Invalid response format:", response);
                        setPokemonNames([]);
                    }
                })
                .catch((error) => {
                    // console.error("API fetch error:", error);
                    setPokemonNames([]);
                })
                .finally(() => setLoading(false));
        }
    }, []);

    return { pokemonNames, loading };
}
