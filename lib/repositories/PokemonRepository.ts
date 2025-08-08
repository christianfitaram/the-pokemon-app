// app/lib/repositories/pokemonRepository.ts

import { Pokemon, PokemonDetails, PokemonListResponse } from "@/types/interfaces";
import { FetchError } from "../error_handling/FetchError";
import redis, { connectRedis } from "@/lib/redis";

const BASE_URL = "https://pokeapi.co/api/v2";

// Simple in-memory fallback cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error(`Fetch timeout after ${timeout}ms`)), timeout)
        )
    ]);
}

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
        await connectRedis();

        const redisKey = `pokeapi:${url}`;
        const cachedData = await redis.get(redisKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // Fallback to in-memory cache (optional)
        const memoryCache = this.getCachedData(url);
        if (memoryCache) {
            return memoryCache;
        }

        await this.throttleRequest();

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await fetchWithTimeout(url, {}, 10000);

                if (res.status === 429 && attempt < retries) {
                    const waitTime = delay * Math.pow(2, attempt);
                    console.warn(`Rate limited, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                if (!res.ok) {
                    const message = `Failed to fetch ${url} - Status: ${res.status} ${res.statusText}`;
                    throw new FetchError(res.status, message);
                }

                const data = await res.json();

                await redis.set(redisKey, JSON.stringify(data), { EX: 60 * 60 * 24 * 7 });
                this.setCachedData(url, data);

                return data;
            } catch (error) {
                if (attempt === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // 🔽 Existing Methods (unchanged)
    static async getAllPokemons(): Promise<PokemonListResponse> {
        return await this.fetchWithErrorHandling(`${BASE_URL}/pokemon?limit=1302`);
    }

    static async gePokemonsFirstPage(): Promise<Pokemon[]> {
        return await this.fetchWithErrorHandling(`${BASE_URL}/pokemon`);
    }

    static async gePokemonsLastPage(n: string): Promise<PokemonListResponse> {
        return this.fetchWithErrorHandling(`${BASE_URL}/pokemon/?offset=${n}`);
    }

    static async gePokemonsCustomPage(url: string): Promise<PokemonListResponse> {
        return this.fetchWithErrorHandling(url);
    }

    static async getPokemonByName(name: string): Promise<PokemonDetails> {
        const data = await this.fetchWithErrorHandling(`${BASE_URL}/pokemon/${name.toLowerCase()}`);
        return data as PokemonDetails;
    }

    static async getPokemonById(id: number): Promise<PokemonDetails> {
        const data = await this.fetchWithErrorHandling(`${BASE_URL}/pokemon/${id}`);
        return data as PokemonDetails;
    }

    static async getPokemonsByType(type: string): Promise<Pokemon[]> {
        const data = await this.fetchWithErrorHandling(`${BASE_URL}/type/${type}`);
        return data.pokemon.map((entry: { pokemon: Pokemon }) => entry.pokemon);
    }

    static async getRandomPokemon(): Promise<PokemonDetails> {
        const randomId = Math.floor(Math.random() * 1302) + 1;
        return this.getPokemonById(randomId);
    }

    static async getEvolutionChainURL(name: string): Promise<string> {
        const speciesData = await this.fetchWithErrorHandling(`${BASE_URL}/pokemon-species/${name}`);
        const evoData = await this.fetchWithErrorHandling(speciesData.evolution_chain.url);
        return evoData.chain.species.url;
    }

    static async getEvolutionChainData(url: string): Promise<string> {
        const speciesData = await this.fetchWithErrorHandling(url);
        const evoData = await this.fetchWithErrorHandling(speciesData.evolution_chain.url);
        return evoData.chain;
    }
}
