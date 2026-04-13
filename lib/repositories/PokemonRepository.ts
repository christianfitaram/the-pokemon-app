// app/lib/repositories/pokemonRepository.ts

import { Pokemon, PokemonDetails, PokemonListResponse } from "@/types/interfaces";
import { EvolutionChain, EvolutionNode } from "@/types/evolutionTypes";
import { FetchError } from "../error_handling/FetchError";
import redis, { connectRedis } from "@/lib/redis";

const BASE_URL = "https://pokeapi.co/api/v2";

// Simple in-memory fallback cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_MEMORY_CACHE_SIZE = 500;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export class PokemonRepository {
    private static enforceMemoryCacheSize() {
        while (cache.size > MAX_MEMORY_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            if (!oldestKey) break;
            cache.delete(oldestKey);
        }
    }

    private static getCachedData(key: string) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            // Refresh insertion order to keep recently-used keys in the cache.
            cache.delete(key);
            cache.set(key, cached);
            return cached.data;
        }
        if (cached) {
            cache.delete(key);
        }
        return null;
    }

    private static setCachedData(key: string, data: unknown) {
        if (cache.has(key)) {
            cache.delete(key);
        }
        cache.set(key, { data, timestamp: Date.now() });
        this.enforceMemoryCacheSize();
    }

    static getMemoryCacheSizeForTests(): number {
        return cache.size;
    }

    static clearMemoryCacheForTests(): void {
        cache.clear();
    }

    private static pruneExpiredMemoryCache() {
        const now = Date.now();
        for (const [key, value] of cache.entries()) {
            if (now - value.timestamp >= CACHE_DURATION) {
                cache.delete(key);
            }
        }
        this.enforceMemoryCacheSize();
    }

    private static async mapWithConcurrency<T, R>(
        items: T[],
        concurrency: number,
        mapper: (item: T) => Promise<R>
    ): Promise<R[]> {
        const safeConcurrency = Math.max(1, Math.min(concurrency, items.length || 1));
        const result: R[] = new Array(items.length);
        let index = 0;

        const workers = new Array(safeConcurrency).fill(null).map(async () => {
            while (index < items.length) {
                const currentIndex = index++;
                result[currentIndex] = await mapper(items[currentIndex]);
            }
        });

        await Promise.all(workers);
        return result;
    }

    private static async enrichPokemonList(results: Pokemon[]): Promise<Pokemon[]> {
        return this.mapWithConcurrency(results, 6, async (pokemon) => {
            try {
                const details = await this.getPokemonByName(pokemon.name);
                return {
                    ...pokemon,
                    id: details.id,
                    types: details.types,
                    base_experience: details.base_experience,
                };
            } catch {
                return pokemon;
            }
        });
    }

    private static async getPokemonPage(offset: number, limit: number = 24): Promise<PokemonListResponse> {
        return this.fetchWithErrorHandling(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
    }

    private static async getEnrichedPokemonPage(offset: number, limit: number = 24): Promise<PokemonListResponse> {
        const response = await this.getPokemonPage(offset, limit);
        const enriched = await this.enrichPokemonList(response.results);
        return { ...response, results: enriched };
    }

    static async fetchWithErrorHandling(url: string, retries = 3, delay = 1000) {
        await connectRedis();
        this.pruneExpiredMemoryCache();

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

    static async getAllPokemons(): Promise<PokemonListResponse> {
        return await this.fetchWithErrorHandling(`${BASE_URL}/pokemon?limit=1302`);
    }

    static async getPokemonsFirstPage(): Promise<PokemonListResponse> {
        return this.getEnrichedPokemonPage(0, 24);
    }

    static async getPokemonsLastPage(n: string): Promise<PokemonListResponse> {
        const offset = Number(n);
        return this.getEnrichedPokemonPage(Number.isFinite(offset) ? offset : 0, 24);
    }

    static async getPokemonsCustomPage(offset: number, limit: number = 24): Promise<PokemonListResponse> {
        return this.getEnrichedPokemonPage(offset, limit);
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
        const countResponse = await this.fetchWithErrorHandling(`${BASE_URL}/pokemon?limit=1`) as PokemonListResponse;
        const total = countResponse.count;
        const randomOffset = Math.floor(Math.random() * total);
        const randomEntry = await this.fetchWithErrorHandling(
            `${BASE_URL}/pokemon?offset=${randomOffset}&limit=1`
        ) as PokemonListResponse;

        const pokemonName = randomEntry.results?.[0]?.name;
        if (!pokemonName) {
            throw new FetchError(500, "Failed to select a random Pokemon");
        }

        return this.getPokemonByName(pokemonName);
    }

    static async getEvolutionChainURL(name: string): Promise<string> {
        const speciesData = await this.fetchWithErrorHandling(`${BASE_URL}/pokemon-species/${name}`);
        return speciesData.evolution_chain.url;
    }

    static async getEvolutionChainData(url: string): Promise<EvolutionNode> {
        const evoData = await this.fetchWithErrorHandling(url) as EvolutionChain;
        return evoData.chain;
    }

    static async getEvolutionChainByPokemonName(name: string): Promise<EvolutionNode> {
        const evolutionChainUrl = await this.getEvolutionChainURL(name);
        return this.getEvolutionChainData(evolutionChainUrl);
    }
}
