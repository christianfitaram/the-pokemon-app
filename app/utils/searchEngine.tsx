import { fetchPokemon } from "./fetchspecials";
import { Pokemon } from "@/types/types";

export const searchEngine = async (data: string[]): Promise<Pokemon[]> => {
  const urlSeed = "https://pokeapi.co/api/v2/type/";

  // Remove duplicates
  let result = [...new Set(data)];

  // Fetch all Pokémon data in parallel
  const pokemonResults = await Promise.all(
    result.map(async (type) => {
      const pokemonList = await fetchPokemon(urlSeed + type);
      return pokemonList?.map((item) => item.pokemon) || []; //Extract only `pokemon` objects
    })
  );

  return pokemonResults.flat(); // Flatten the array so it's a clean list of Pokémon objects
};
