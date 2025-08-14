import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";
import { Pokemon } from "@/types/interfaces";

export const searchEngine = async (data: string[]): Promise<Pokemon[]> => {

  // Remove duplicates
  let result = [...new Set(data)];

  // Fetch all Pokémon data in parallel
  const pokemonResults = await Promise.all(
    result.map(async (type) => {
      const pokemonList = await PokemonApiClient.getPokemonsByType(type);
      return pokemonList.data || []; //Extract only `pokemon` objects
    })
  );

  // Flatten the array of arrays into a single array of Pokémon objects
  return pokemonResults.flat();
};
