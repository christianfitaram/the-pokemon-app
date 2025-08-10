import {useEffect, useState} from "react";
import {Pokemon, PokemonListResponse, ApiResponse} from "@/types/interfaces";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";

export function useAllPokemonNames() {
    const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndSetPokemonNames = async () => {
            try {
                const response = await PokemonApiClient.getAllPokemons();
                if (response.success && response.data) {
                    const pokemonData = response.data.results || [];
                    setPokemonNames(pokemonData);

                    // Try to store in localStorage, but don't rely on it
                    try {
                        localStorage.setItem("allPokemonNames", JSON.stringify(pokemonData));
                    } catch (e) {
                        // Silently handle localStorage errors
                        console.debug("localStorage not available");
                    }
                } else {
                    setPokemonNames([]);
                }
            } catch (error) {
                console.error("Failed to fetch Pokemon names:", error);
                setPokemonNames([]);
            } finally {
                setLoading(false);
            }
        };

        let stored: string | null = null;
        try {
            stored = localStorage.getItem("allPokemonNames");
            if (stored?.length == 0) {
                stored = null
            }
        } catch (e) {
            // Silently handle localStorage errors
            console.debug("localStorage not available");
        }

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const names = Array.isArray(parsed) ? parsed : parsed.results || [];
                setPokemonNames(names);
                setLoading(false);
            } catch (error) {
                // If parsing fails, fetch from API
                fetchAndSetPokemonNames();
            }
        } else {
            fetchAndSetPokemonNames();
        }
    }, []);

    return {pokemonNames, loading};
}
