import { Pokemon } from "@/types/types";
import PokemonCard from "./PokemonCard";
interface PokemonsToDisplayProps {
  pokemons: Pokemon[];
  prevtUrl: string | null;
  nextUrl: string | null;
  lastUrl: string;
  loading: boolean;
  isSearchOn: boolean;
  fetchPokemon: (url: string) => void;
}

const PokemonsToDisplay: React.FC<PokemonsToDisplayProps> = ({
  pokemons,
  prevtUrl,
  nextUrl,
  lastUrl,
  loading,
  isSearchOn,
  fetchPokemon,
}) => {
  return (
    <div className="z-0 flex flex-col items-center justify-center w-full max-w-screen-xl space-y-6 px-4 sm:px-8">
      {/* Pokémon Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 w-full place-items-stretch">
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
            <PokemonCard pokemonOverview={pokemon} key={key} />
          )
        )}
      </div>
      {/* Pagination Section (Separate from Grid) */}
      {!loading && !isSearchOn && (
        <div className="w-full flex justify-center mt-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => fetchPokemon("https://pokeapi.co/api/v2/pokemon/")}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              &#10094; Start
            </button>

            <button
              type="button"
              disabled={!prevtUrl}
              onClick={() => fetchPokemon(prevtUrl || "")}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              &#10094;
            </button>

            <button
              type="button"
              disabled={!nextUrl}
              onClick={() => fetchPokemon(nextUrl || "")}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              &#10095;
            </button>

            <button
              type="button"
              onClick={() => fetchPokemon(lastUrl)}
              className="px-5 py-2.5 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
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
