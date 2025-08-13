import { PokemonsToDisplayProps } from "@/types/interfaces";
import PokemonCard from "./PokemonCard";

const PokemonsToDisplay: React.FC<PokemonsToDisplayProps> = ({
  pokemons,
  prevUrl,
  nextUrl,
  loading,
  isSearchOn,
  fetchPokemon,
  fetchLastPage
}) => {
  return (
    <div className="z-0 flex flex-col items-center justify-center w-full max-w-screen-xl space-y-6 px-4 sm:px-8">
      {/* Pokémon Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full place-items-stretch">
        {pokemons.map((pokemon, key) =>
          loading ? (
            <div
              key={`skeleton-${key}`}
              className="background-muted rounded-lg p-6 shadow-md animate-pulse h-fit flex flex-col justify-between gap-4"
            >
              <div className="flex flex-row items-center justify-center">
                <div className="h-6 bg-gray-700 rounded w-8"></div>
              </div>
              <div className="flex flex-row items-center justify-center">
                <div className="h-24 bg-gray-700 rounded w-36"></div>
              </div>
              <div className="flex flex-row items-center justify-center">
                <div className="h-6 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="flex flex-row items-center justify-center gap-4">
                <div className="h-4 bg-gray-700 rounded w-6"></div>
                <div className="h-4 bg-gray-700 rounded w-6"></div>
              </div>
            </div>
          ) : (
            // Render the actual PokemonCard component
            <PokemonCard pokemonOverview={pokemon} key={key} />
          )
        )}
      </div>
      {/* Display message if loading is done but no Pokémon were found */}
      {!loading && pokemons.length === 0 && (
        <p className="text-center text-muted-foreground mt-4">
          No Pokémon found.
        </p>
      )}
      {/* Pagination Section (Separate from Grid) */}
      {!loading && !isSearchOn && (
        <div className="w-full flex justify-center mt-4">
          <div className="flex gap-4">
            <button
              type="button"
              disabled={!prevUrl}
              onClick={() => fetchPokemon(undefined, true)}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:bg-blue-900"
            >
              &#10094; Start
            </button>

            <button
              type="button"
              disabled={!prevUrl}
              onClick={() => fetchPokemon(prevUrl || "", false)}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:bg-blue-900"
            >
              &#10094;
            </button>

            <button
              type="button"
              disabled={!nextUrl}
              onClick={() => fetchPokemon(nextUrl || "", false)}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:bg-blue-900"
            >
              &#10095;
            </button>

            <button
              type="button"
              disabled={!nextUrl}
              onClick={() => fetchLastPage()}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800  disabled:bg-blue-900"
            >
              End &#10095;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonsToDisplay;
