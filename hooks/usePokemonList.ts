import {useEffect, useState, useRef, useCallback} from "react";
import {ApiResponse, PokemonListResponse, Pokemon, UsePokemonListProps} from "@/types/interfaces";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";
import {getTotalNumPokemon} from "@/lib/getTotalNumPokemon";

const DEFAULT_LIMIT = 24;

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
                                   onChange,
                                   isSearchOn,
                                   initialPage = 0
                               }: UsePokemonListProps) => {
    const [pokemonList, setPokemonList] = useState<Pokemon[]>(initialValue);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [nextUrl, setNextUrl] = useState<string | null>(
        "https://pokeapi.co/api/v2/pokemon/"
    );
    const [prevUrl, setPrevUrl] = useState<string | null>(null);
    const [count, setCount] = useState<number>(1302);
    const initialFetchDone = useRef<boolean>(false);

    // Handler for API response
    const handlePokemonApiResponse = (data: PokemonListResponse) => {
        onChange([...data.results]);
        setPokemonList([...data.results]);
        setNextUrl(data.next);
        setPrevUrl(data.previous);
        setCount(data.count);
    };

    const fetchLastPage = useCallback(async () => {
        try {
            setLoading(true);
            const totalPokemon = await getTotalNumPokemon();
            const offset = Math.max(0, totalPokemon - DEFAULT_LIMIT);
            const response = await PokemonApiClient.getPokemonsCustomPage(offset, DEFAULT_LIMIT);

            if (response.success && response.data) {
                setPokemonList(response.data.results);
                setNextUrl(response.data.next);
                setPrevUrl(response.data.previous);

                if (!isSearchOn) {
                    onChange(response.data.results);
                }
            } else {
                setError(response.error || "Failed to fetch last page");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch Pokemon');
        } finally {
            setLoading(false);
        }
    }, [onChange, isSearchOn]);


    // Unified fetch logic
    const fetchAndHandle = async (
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
    };

    const fetchPokemon = async (url?: string, isInitial: boolean = false) => {
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
    };


    useEffect(() => {
        if (initialFetchDone.current || isSearchOn) return;
        initialFetchDone.current = true;
        fetchPokemon(undefined, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearchOn]);

    return {
        pokemonList,
        loading,
        error,
        nextUrl,
        prevUrl,
        count,
        fetchPokemon,
        fetchLastPage,
        setPokemonList, // in case you want to update it directly
    };
}; 
