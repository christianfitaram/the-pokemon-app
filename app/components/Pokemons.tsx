"use client";
import { useEffect, useState, useRef } from "react";
import {
  Response,
  Pokemon,
  ToDisplayProps,
} from "@/types/types";
import { getLastPage } from "@/app/utils/fetchspecials";
import PokemonCard from "./PokemonCard";
import PokemonsToDisplay from "./PokemonsTodisplay";

const Pokemons: React.FC<ToDisplayProps> = ({
  value,
  onChange,
  isSearchOn,
  setisSearchOn,
}) => {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>(value);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(
    "https://pokeapi.co/api/v2/pokemon/"
  );
  const [prevtUrl, setPrevUrl] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string>("");
  const [count, setCount] = useState<number>(1302);
  const initialFetchDone = useRef<boolean>(false);

  const fetchPokemon = async (url: string) => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data: Response = await res.json();
      onChange([...data.results]);
      setPokemonList([...data.results]);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
      setCount(data.count);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function getLastUrl() {
      const url = await getLastPage(count);
      setLastUrl(url);
    }
    getLastUrl();
  }, [count]);

  useEffect(() => {
    if (initialFetchDone.current || isSearchOn) return;
    initialFetchDone.current = true;
    fetchPokemon("https://pokeapi.co/api/v2/pokemon/");
  }, [isSearchOn]);
  if (error) return <div className="text-center text-red-500">{error}</div>;
  return loading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4  max-w-screen-xl gap-8 place-items-stretch">
      {Array(20)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center justify-center text-center 
  w-full h-full p-6 rounded-tr-3xl rounded-bl-3xl shadow 
  background-muted overflow-hidden animate-pulse"
          >
            <div className="absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l from-gray-700 to-gray-900 opacity-40 rounded-tr-3xl rounded-bl-3xl"></div>
            <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

            <div className="flex flex-col items-center justify-center h-full relative z-10 gap-4">
              <div className="w-40 h-40 bg-gray-700 rounded-xl"></div>

              <div className="w-24 h-4 bg-gray-600 rounded"></div>

              <div className="flex gap-2 flex-wrap justify-center">
                <div className="w-16 h-4 bg-gray-700 rounded"></div>
                <div className="w-14 h-4 bg-gray-700 rounded"></div>
              </div>

              <div className="w-28 h-4 bg-gray-800 rounded"></div>
            </div>
          </div>
        ))}
    </div>
  ) : (
    <PokemonsToDisplay
      pokemons={isSearchOn ? value : pokemonList}
      prevtUrl={prevtUrl}
      nextUrl={nextUrl}
      lastUrl={lastUrl || ""}
      loading={loading}
      isSearchOn={isSearchOn}
      fetchPokemon={fetchPokemon}
    />
  );
};
export default Pokemons;
