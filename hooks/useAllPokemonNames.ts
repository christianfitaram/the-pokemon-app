import { useEffect, useState } from "react";
import { Pokemon, PokemonListResponse, ApiResponse } from "@/types/interfaces";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

export function useAllPokemonNames() {
    const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("allPokemonNames");
        console.log("Stored pokemon names:", stored); // Debug log
        
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log("Parsed stored names:", parsed); // Debug log
                setPokemonNames(Array.isArray(parsed) ? parsed : []);
                setLoading(false);
            } catch (error) {
                console.error("Error parsing stored Pokemon names:", error);
                setPokemonNames([]);
                setLoading(false);
            }
        } else {
            console.log("No stored names, fetching from API..."); // Debug log
            PokemonApiClient.getAllPokemons()
                .then((response: ApiResponse<PokemonListResponse>) => {
                    console.log("API Response:", response); // Debug log
                    if (response.success && response.data) {
                        const pokemonData = response.data?.results || [];
                        try {
                            localStorage.setItem("allPokemonNames", JSON.stringify(pokemonData));
                            console.log("Successfully stored in localStorage"); // Debug log
                        } catch (e) {
                            console.error("Error storing in localStorage:", e);
                        }
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
