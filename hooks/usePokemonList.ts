import { useEffect, useState, useRef } from "react";
import { Response, Pokemon, ToDisplayProps } from "@/types/types";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

interface UsePokemonListProps {
  initialValue: Pokemon[];
  onChange: (pokemons: Pokemon[]) => void;
  isSearchOn: boolean;
}

export const usePokemonList = ({ initialValue, onChange, isSearchOn }: UsePokemonListProps) => {
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
  const handlePokemonApiResponse = (data: Response) => {
    onChange([...data.results]);
    setPokemonList([...data.results]);
    setNextUrl(data.next);
    setPrevUrl(data.previous);
    setCount(data.count);
  };

  // Unified fetch logic
  const fetchAndHandle = async (fetcher: () => Promise<any>) => {
    try {
      setLoading(true);
      const res = await fetcher();
      const data = res?.data;
      if (!data) throw new Error("No data returned from API");
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
    await fetchAndHandle(() => PokemonApiClient.getPokemonsCustomtPage(url));
  };

  const fetchLastPage = async () => {
    await fetchAndHandle(() => PokemonApiClient.getPokemonsLastPage(count.toString()));
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