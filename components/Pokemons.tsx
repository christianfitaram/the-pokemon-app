"use client";
import { useEffect, useRef, useState } from "react";
import { ToDisplayProps } from "@/types/interfaces";
import { PokemonsToDisplay } from "./PokemonsTodisplay";
import { usePokemonList } from "@/hooks/usePokemonList";
import { formatURLpagination } from "@/utils/formatURLpagination";

const Pokemons: React.FC<
    ToDisplayProps & {
    typeLoading?: boolean;
    onFetchPokemon?: (fetchPokemon: (url?: string, isInitial?: boolean) => void) => void;
}
> = ({ value, onChange, isSearchOn, typeLoading = false, onFetchPokemon }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const hasFetchedInitial = useRef(false);

    // 1) Restore saved page from localStorage (client-only)
    useEffect(() => {
        try {
            const saved = JSON.parse(
                localStorage.getItem("pokemonDisplayPreferences") || '{"currentPage":0}'
            );
            setCurrentPage(saved.currentPage ?? 0);
        } catch (e) {
            console.error("Error loading preferences:", e);
            setCurrentPage(0);
        }
        setIsInitialized(true);
    }, []);

    // 2) Hook for list data
    const {
        pokemonList,
        loading,
        error,
        nextUrl,
        prevUrl,
        fetchPokemon,
        fetchLastPage,
    } = usePokemonList({
        initialValue: value,
        onChange,
        isSearchOn,
        // We pass the current page here, but we’ll still trigger an explicit fetch below.
        initialPage: currentPage,
    });

    // 3) Expose fetchPokemon to parent if needed
    useEffect(() => {
        if (onFetchPokemon) onFetchPokemon(fetchPokemon);
    }, [onFetchPokemon, fetchPokemon]);

    // 4) Once: fetch the restored page
    useEffect(() => {
        if (!isInitialized || isSearchOn || hasFetchedInitial.current) return;

        const run = async () => {
            try {
                const url = formatURLpagination(currentPage, 24);
                await fetchPokemon(url, false);
                hasFetchedInitial.current = true;
            } catch (e) {
                console.error("Initial page fetch failed:", e);
            }
        };

        run();
    }, [isInitialized, isSearchOn, currentPage, fetchPokemon]);

    if (!isInitialized || error) {
        return error ? <div className="text-center text-red-500">{error}</div> : null;
    }

    return (
        <PokemonsToDisplay
            pokemons={isSearchOn ? value : pokemonList}
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            loading={loading || typeLoading} // keep prop name if used elsewhere
            isSearchOn={isSearchOn}
            fetchPokemon={fetchPokemon}
            fetchLastPage={fetchLastPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pending={loading || typeLoading} // NEW
        />
    );
};

export default Pokemons;
