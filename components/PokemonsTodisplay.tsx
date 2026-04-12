import { useEffect } from "react";
import { PokemonsToDisplayProps } from "@/types/interfaces";
import PokemonCard from "./PokemonCard";
import { PaginationBar } from "@/components/layout/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Grid2x2, List } from "lucide-react";
import { useDisplayPreferences } from "@/hooks/useDisplayPreferences";

export const PokemonsToDisplay: React.FC<PokemonsToDisplayProps> = ({
                                                                        pokemons,
                                                                        count,
                                                                        loading,
                                                                        isSearchOn,
                                                                        currentPage,
                                                                        onPageChange,
                                                                        pending = false,
                                                                    }) => {
    const { totalPages } = usePagination(count, 24);
    const { preferences, updatePreferences } = useDisplayPreferences();

    useEffect(() => {
        if (isSearchOn) return;
        if (totalPages <= 0) return;
        if (currentPage >= totalPages) {
            onPageChange(totalPages - 1);
        }
    }, [isSearchOn, totalPages, currentPage, onPageChange]);

    const handlePageChange = (page: number) => {
        if (page >= 0 && page < totalPages) {
            onPageChange(page);
        }
    };

    const handleToggleList = () => {
        if (pending) return; // avoid rapid flips during fetch
        updatePreferences({ isListView: !preferences.isListView });
    };

    return (
        <div className="relative z-0 w-full max-w-screen-xl px-4 sm:px-8 space-y-6">
            <button
                onClick={handleToggleList}
                disabled={pending}
                className={`bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-full shadow-lg self-end flex flex-row items-center gap-2`}
            >
                {preferences.isListView
                    ? <>See grid <Grid2x2 /></>
                    : <>See list <List /></>
                }
            </button>

            <div className={`w-full ${preferences.isListView
                ? 'flex flex-col gap-4'
                : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8'
            }`}>
                {pokemons.map((pokemon) => (
                    <PokemonCard
                        pokemonOverview={pokemon}
                        key={pokemon.name}
                        isList={preferences.isListView}
                    />
                ))}
            </div>

            {!loading && !isSearchOn && (
                <div className="w-full flex justify-center mt-4">
                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={handlePageChange}
                    />
                </div>
            )}

            {pending && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
};
