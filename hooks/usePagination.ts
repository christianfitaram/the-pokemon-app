// hooks/usePagination.ts
import { useState, useEffect } from 'react';
import { getTotalNumPokemon } from '@/lib/getTotalNumPokemon';
import { getNumberOfPages } from '@/utils/getNumberOfPages';
import {UsePaginationReturn} from '@/types/interfaces';
export const usePagination = (itemsPerPage: number = 24): UsePaginationReturn => {
    const [totalNumPokemon, setTotalNumPokemon] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchTotalPokemon = async () => {
            try {
                setIsLoading(true);
                const res = await getTotalNumPokemon();
                setTotalNumPokemon(res);
            } catch (err) {
                console.error("Failed to fetch total number of Pokémon:", err);
                setError(err instanceof Error ? err : new Error('Failed to fetch total number of Pokémon'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchTotalPokemon();
    }, []);

    useEffect(() => {
        if (totalNumPokemon > 0) {
            setTotalPages(getNumberOfPages(totalNumPokemon, itemsPerPage));
        }
    }, [totalNumPokemon, itemsPerPage]);

    return {
        totalPages,
        isLoading,
        error
    };
};
