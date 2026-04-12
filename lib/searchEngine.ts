import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";
import { Pokemon } from "@/types/interfaces";

export const searchEngine = async (data: string[]): Promise<Pokemon[]> => {
  // Remove duplicates
  const result = [...new Set(data)];

  if (result.length === 0) return [];

  // Fetch all Pokemon groups in parallel
  const pokemonGroups = await Promise.all(
    result.map(async (type) => {
      const pokemonList = await PokemonApiClient.getPokemonsByType(type);
      return pokemonList.success && pokemonList.data ? pokemonList.data : [];
    })
  );

  if (pokemonGroups.length === 1) return pokemonGroups[0];

  // Intersect across all selected types
  return pokemonGroups.reduce((acc, current) => {
    return acc.filter((pokemon) =>
      current.some((item) => item.name === pokemon.name)
    );
  }, pokemonGroups[0]);
};
