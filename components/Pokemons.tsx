"use client";
import { useCallback, useEffect, useState } from "react";
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
    const [retryNonce, setRetryNonce] = useState(0);
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

    const handleRetry = useCallback(() => {
        setRetryNonce((value) => value + 1);
    }, []);

    useEffect(() => {
        if (isSearchOn) return;
        const url = formatURLpagination(currentPage, 24);
        fetchPokemon(url, false).catch((e) => {
            console.error("Page fetch failed:", e);
        });
    }, [isSearchOn, currentPage, fetchPokemon, retryNonce]);

    if (error) {
        return (
            <div className="w-full max-w-screen-xl px-4 sm:px-8 py-8 text-center space-y-4">
                <p className="text-red-400" role="alert" aria-live="assertive">
                    {error}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Retry page load
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="rounded border border-gray-400 px-4 py-2 text-white hover:bg-gray-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {!isSearchOn && (loading || typeLoading) && (
                <p className="sr-only" role="status" aria-live="polite">
                    Loading Pokemon list.
                </p>
            )}
            <PokemonsToDisplay
                pokemons={isSearchOn ? value : pokemonList}
                count={count}
                loading={loading || typeLoading}
                isSearchOn={isSearchOn}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                pending={loading || typeLoading}
            />
        </>
    );
};

export default Pokemons;
