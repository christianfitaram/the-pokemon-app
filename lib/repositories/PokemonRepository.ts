// app/lib/repositories/pokemonRepository.ts

import { Pokemon, PokemonDetails, Response } from "@/types/types";
import { FetchError } from "../error_handling/FetchError";

const BASE_URL = "https://pokeapi.co/api/v2";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
// Request throttling
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export class PokemonRepository {
  private static getCachedData(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  private static async throttleRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
  }

  static async fetchWithErrorHandling(url: string, retries = 3, delay = 1000) {
    // Check cache first
    const cachedData = this.getCachedData(url);
    if (cachedData) {
      return cachedData;
    }

    // Throttle requests
    await this.throttleRequest();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);
        
        if (res.status === 429 && attempt < retries) {
          // Rate limited - wait with exponential backoff
          const waitTime = delay * Math.pow(2, attempt);
          console.log(`Rate limited, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!res.ok) {
          const message = `Failed to fetch ${url} - Status: ${res.status} ${res.statusText}`;
          throw new FetchError(res.status, message);
        }
        
        const data = await res.json();
        
        // Cache the successful response
        this.setCachedData(url, data);
        
        return data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // For other errors, wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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
