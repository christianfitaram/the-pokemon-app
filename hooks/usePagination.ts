// hooks/usePagination.ts
import { useMemo } from 'react';
import { getNumberOfPages } from '@/utils/getNumberOfPages';
import {UsePaginationReturn} from '@/types/interfaces';
export const usePagination = (totalNumPokemon: number, itemsPerPage: number = 24): UsePaginationReturn => {
    const safeTotal = Number.isFinite(totalNumPokemon) && totalNumPokemon > 0 ? totalNumPokemon : 0;
    const totalPages = useMemo(
        () => (safeTotal > 0 ? getNumberOfPages(safeTotal, itemsPerPage) : 1),
        [safeTotal, itemsPerPage]
    );

    return {
        totalPages,
        isLoading: false,
        error: null
    };
};
