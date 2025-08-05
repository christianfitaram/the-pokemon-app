"use client";
import { useEffect, useState, useRef } from "react";
import { ToDisplayProps } from "@/types/types";
import PokemonsToDisplay from "./PokemonsTodisplay";
import { usePokemonList } from "@/hooks/usePokemonList";

const Pokemons: React.FC<ToDisplayProps & { typeLoading?: boolean; onFetchPokemon?: (fetchPokemon: (url?: string, isInitial?: boolean) => void) => void }> = ({
  value,
  onChange,
  isSearchOn,
  typeLoading = false,
  onFetchPokemon,
}) => {
  const {
    pokemonList,
    loading,
    error,
    nextUrl,
    prevUrl,
    fetchPokemon,
    fetchLastPage,
  } = usePokemonList({ initialValue: value, onChange, isSearchOn });

  // Expose fetchPokemon to parent
  useEffect(() => {
    if (onFetchPokemon) {
      onFetchPokemon(fetchPokemon);
    }
  }, [onFetchPokemon, fetchPokemon]);

  if (error) return <div className="text-center text-red-500">{error}</div>;

  return loading || typeLoading ? (
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
      prevtUrl={prevUrl}
      nextUrl={nextUrl}
      loading={loading || typeLoading}
      isSearchOn={isSearchOn}
      fetchPokemon={fetchPokemon}
      fetchLastPage={fetchLastPage}
    />
  );
};
export default Pokemons;
