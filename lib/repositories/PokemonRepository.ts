// app/lib/repositories/pokemonRepository.ts

import { Pokemon, PokemonDetails, Response } from "@/types/types";
import { FetchError } from "../error_handling/FetchError";

const BASE_URL = "https://pokeapi.co/api/v2";

export class PokemonRepository {
  static async fetchWithErrorHandling(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
      const message = `Failed to fetch ${url} - Status: ${res.status} ${res.statusText}`;
      throw new FetchError(res.status, message);
    }
    return res.json();
  }

  static async getAllPokemons(): Promise<Response> {
    return this.fetchWithErrorHandling(`${BASE_URL}/pokemon?limit=1302`);
  }

  static async gePokemonsFirstPage(): Promise<Response> {
    return this.fetchWithErrorHandling(`${BASE_URL}/pokemon`);
  }

  static async gePokemonsLastPage(n: string): Promise<Response> {
    return this.fetchWithErrorHandling(`${BASE_URL}/pokemon/?offset=${n}`);
  }

  static async gePokemonsCustomPage(url: string): Promise<Response> {
    return this.fetchWithErrorHandling(url);
  }

  static async getPokemonByName(name: string): Promise<PokemonDetails> {
    return this.fetchWithErrorHandling(`${BASE_URL}/pokemon/${name}`);
  }

  static async getPokemonById(id: number): Promise<PokemonDetails> {
    return this.fetchWithErrorHandling(`${BASE_URL}/pokemon/${id}`);
  }

  static async getPokemonsByType(type: string): Promise<Pokemon[]> {
    const data = await this.fetchWithErrorHandling(`${BASE_URL}/type/${type}`);
    return data.pokemon.map((item: any) => item.pokemon);
  }

  static async getRandomPokemon(): Promise<PokemonDetails> {
    const randomId = Math.floor(Math.random() * 1302) + 1;
    return this.getPokemonById(randomId);
  }

  static async getEvolutionChainURL(name: string): Promise<string> {
    const speciesData = await this.fetchWithErrorHandling(
      `${BASE_URL}/pokemon-species/${name}`
    );
    const evoData = await this.fetchWithErrorHandling(
      speciesData.evolution_chain.url
    );
    console.log(evoData.chain.species.url);
    return evoData.chain.species.url;
  }

  static async getEvolutionChainData(url: string): Promise<string> {
    const speciesData = await this.fetchWithErrorHandling(url);
    const evoData = await this.fetchWithErrorHandling(
      speciesData.evolution_chain.url
    );
    return evoData.chain;
  }
}
