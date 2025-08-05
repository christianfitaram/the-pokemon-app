// lib/apiClients/pokemonApiClient.ts
import { EvolutionNode } from "@/types/evolutionTypes";
import { Pokemon, PokemonDetails, Response } from "@/types/types";
import { ApiClient } from "../../utils/apiClient";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class PokemonApiClient {

  static async getPokemonByName(name: string): Promise<ApiResponse<PokemonDetails>> {
    try {
      const data = await ApiClient.get(`/pokemons/details/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsByType(type: string): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get(`/pokemons/get-by-type/${type}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getAllPokemons(): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get(`/pokemons/get-all`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsFirstPage(): Promise<ApiResponse<Response>> {
    try {
      const data = await ApiClient.get(`/pokemons/first-page`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsLastPage(n: string): Promise<ApiResponse<Response>> {
    try {
      const data = await ApiClient.get(`/pokemons/last-page/${n}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsCustomtPage(urlParameter: string): Promise<ApiResponse<Response>> {
    try {
      const data = await ApiClient.post(`/pokemons/custom-page`, { url: urlParameter });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getRandomPokemon(): Promise<ApiResponse<Pokemon>> {
    try {
      const data = await ApiClient.get(`/pokemons/random`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonEvolutionChain(name: string): Promise<ApiResponse<EvolutionNode>> {
    try {
      const data = await ApiClient.get(`/pokemons/evolution-chain/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
