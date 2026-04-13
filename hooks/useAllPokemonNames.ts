import {useEffect, useRef, useState} from "react";
import {Pokemon} from "@/types/interfaces";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";

const MIN_QUERY_LENGTH = 2;
const RESULTS_LIMIT = 20;
const DEBOUNCE_MS = 150;
const QUERY_CACHE_LIMIT = 100;

export function useAllPokemonNames(searchQuery: string) {
    const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);
    const queryCacheRef = useRef<Map<string, Pokemon[]>>(new Map());

    useEffect(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (normalizedQuery.length < MIN_QUERY_LENGTH) {
            setPokemonNames([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isCancelled = false;

        const fetchAndSetPokemonNames = async () => {
            const cached = queryCacheRef.current.get(normalizedQuery);
            if (cached) {
                setPokemonNames(cached);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await PokemonApiClient.getAllPokemons({
                    query: normalizedQuery,
                    limit: RESULTS_LIMIT,
                    signal: controller.signal,
                });
                if (isCancelled) return;
                if (response.success && response.data) {
                    if (queryCacheRef.current.size >= QUERY_CACHE_LIMIT) {
                        const oldestQuery = queryCacheRef.current.keys().next().value;
                        if (oldestQuery) {
                            queryCacheRef.current.delete(oldestQuery);
                        }
                    }
                    queryCacheRef.current.set(normalizedQuery, response.data);
                    setPokemonNames(response.data);
                } else {
                    setPokemonNames([]);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Failed to fetch Pokemon names:", error);
                    setPokemonNames([]);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        const timeoutId = window.setTimeout(fetchAndSetPokemonNames, DEBOUNCE_MS);
        return () => {
            isCancelled = true;
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchQuery]);

    return {pokemonNames, loading};
}
