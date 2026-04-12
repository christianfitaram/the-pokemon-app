import {useCallback, useState} from "react";
import {ApiResponse, PokemonListResponse, Pokemon, UsePokemonListProps} from "@/types/interfaces";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";

const DEFAULT_LIMIT = 24;
const DEFAULT_POKEMON_COUNT = 1302;

function parsePaginationUrl(url: string): { offset: number; limit: number } | null {
    try {
        const parsed = new URL(url);
        const offset = Number(parsed.searchParams.get("offset") ?? 0);
        const limit = Number(parsed.searchParams.get("limit") ?? DEFAULT_LIMIT);
        if (!Number.isInteger(offset) || offset < 0) return null;
        if (!Number.isInteger(limit) || limit <= 0 || limit > 100) return null;
        return { offset, limit };
    } catch {
        return null;
    }
}


export const usePokemonList = ({
                                   initialValue,
                                   onChange
                               }: UsePokemonListProps) => {
    const [pokemonList, setPokemonList] = useState<Pokemon[]>(initialValue);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState<number>(DEFAULT_POKEMON_COUNT);

    // Handler for API response
    const handlePokemonApiResponse = (data: PokemonListResponse) => {
        onChange([...data.results]);
        setPokemonList([...data.results]);
        setCount(data.count);
    };


    // Unified fetch logic
    const fetchAndHandle = useCallback(async (
        fetcher: () => Promise<ApiResponse<PokemonListResponse>>
    ) => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetcher();
            const data = res?.data;
            if (!res.success || !data) {
                setError(res.error || "No data returned from API");
                return;
            }
            handlePokemonApiResponse(data);
        } catch (error) {
            setError((error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [onChange]);

    const fetchPokemon = useCallback(async (url?: string, isInitial: boolean = false) => {
        if (isInitial) {
            await fetchAndHandle(() => PokemonApiClient.getPokemonsFirstPage());
            return;
        }
        if (!url) {
            setError("No URL provided for fetching data");
            setLoading(false);
            return;
        }

        const pagination = parsePaginationUrl(url);
        if (!pagination) {
            setError("Invalid pagination URL provided");
            setLoading(false);
            return;
        }

        await fetchAndHandle(() =>
            PokemonApiClient.getPokemonsCustomPage(pagination.offset, pagination.limit)
        );
    }, [fetchAndHandle]);

    return {
        pokemonList,
        loading,
        error,
        count,
        fetchPokemon,
        setPokemonList, // in case you want to update it directly
    };
};
