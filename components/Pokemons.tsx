"use client";
import { useCallback, useEffect } from "react";
import { ToDisplayProps } from "@/types/interfaces";
import { PokemonsToDisplay } from "./PokemonsTodisplay";
import { usePokemonList } from "@/hooks/usePokemonList";
import { formatURLpagination } from "@/utils/formatURLpagination";
import { useRouter } from "next/navigation";

const Pokemons: React.FC<
    ToDisplayProps & {
    currentPage: number;
    typeLoading?: boolean;
}
> = ({ value, onChange, isSearchOn, currentPage, typeLoading = false }) => {
    const router = useRouter();
    const {
        pokemonList,
        loading,
        error,
        count,
        fetchPokemon,
    } = usePokemonList({
        initialValue: value,
        onChange,
    });

    const handlePageChange = useCallback((page: number) => {
        router.push(`/pokedex/${page + 1}`);
    }, [router]);

    useEffect(() => {
        if (isSearchOn) return;
        const url = formatURLpagination(currentPage, 24);
        fetchPokemon(url, false).catch((e) => {
            console.error("Page fetch failed:", e);
        });
    }, [isSearchOn, currentPage, fetchPokemon]);

    if (error) {
        return error ? <div className="text-center text-red-500">{error}</div> : null;
    }

    return (
        <PokemonsToDisplay
            pokemons={isSearchOn ? value : pokemonList}
            count={count}
            loading={loading || typeLoading}
            isSearchOn={isSearchOn}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            pending={loading || typeLoading}
        />
    );
};

export default Pokemons;
