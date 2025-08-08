import {useEffect, useState} from "react";
import {Pokemon} from "@/types/interfaces";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";

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
                    if (response.success && response.data) {
                        const pokemonData =  response.data;
                        localStorage.setItem("allPokemonNames", JSON.stringify(pokemonData));
                        setPokemonNames(pokemonData);
                    } else {
                        console.error("Invalid response format:", response);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching Pokemon names:", error);
                })
                .finally(() => setLoading(false));
        }
    }, []);

    return {pokemonNames, loading};
}
