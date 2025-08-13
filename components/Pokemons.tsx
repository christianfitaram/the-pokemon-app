"use client";
import {useEffect} from "react";
import {ToDisplayProps} from "@/types/interfaces";
import PokemonsToDisplay from "./PokemonsTodisplay";
import {usePokemonList} from "@/hooks/usePokemonList";
import {SkeletonPokemonList} from "@/components/layout/Skeletons";

const Pokemons: React.FC<ToDisplayProps & {
    typeLoading?: boolean;
    onFetchPokemon?: (fetchPokemon: (url?: string, isInitial?: boolean) => void) => void
}> = ({
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
    } = usePokemonList({initialValue: value, onChange, isSearchOn});

    // Expose fetchPokemon to parent
    useEffect(() => {
        if (onFetchPokemon) {
            onFetchPokemon(fetchPokemon);
        }
    }, [onFetchPokemon, fetchPokemon]);

    if (error) return <div className="text-center text-red-500">{error}</div>;

    return loading || typeLoading ? (
        <SkeletonPokemonList/>
    ) : (
        <PokemonsToDisplay
            pokemons={isSearchOn ? value : pokemonList}
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            loading={loading || typeLoading}
            isSearchOn={isSearchOn}
            fetchPokemon={fetchPokemon}
            fetchLastPage={fetchLastPage}
        />
    );
};
export default Pokemons;
