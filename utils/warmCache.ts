import { createClient } from "redis";
import fetch from "node-fetch";
import "dotenv/config";

interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        name: string;
        url: string;
    }[];
}

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

const BASE_URL = "https://pokeapi.co/api/v2";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function toCacheKey(url: string) {
    return `pokeapi:${url}`;
}

function extractPokemonId(url: string): string | null {
    const match = url.match(/\/pokemon\/(\d+)\/?$/);
    return match ? match[1] : null;
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);
            
            if (res.status === 429 && attempt < retries) {
                const waitTime = delay * Math.pow(2, attempt);
                console.log(`Rate limited, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            if (attempt === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function warmCache() {
    console.log("🚀 Starting cache warm-up...");
    
    await redisClient.connect();

    try {
        const allPokemonUrl = `${BASE_URL}/pokemon?limit=1302`;
        const firstPageUrl = `${BASE_URL}/pokemon?limit=24`;
        const listKey = toCacheKey(allPokemonUrl);
        const firstPageKey = toCacheKey(firstPageUrl);

        const listExists = await redisClient.exists(listKey);

        if (!listExists) {
            console.log("Warming up Pokemon list...");
            const pokemonList = await fetchWithRetry(allPokemonUrl);
            await redisClient.set(listKey, JSON.stringify(pokemonList), {
                EX: CACHE_TTL_SECONDS
            });
            console.log("✅ Pokemon list cached");
        }

        const firstPageExists = await redisClient.exists(firstPageKey);
        if (!firstPageExists) {
            console.log("Warming up first page...");
            const firstPage = await fetchWithRetry(firstPageUrl);
            await redisClient.set(firstPageKey, JSON.stringify(firstPage), {
                EX: CACHE_TTL_SECONDS
            });
            console.log("✅ First page cached");
        }

        const list = await fetchWithRetry(allPokemonUrl) as PokemonListResponse;
        const total = list.results.length;

        console.log(`Found ${total} Pokemon to cache`);

        for (let i = 0; i < list.results.length; i++) {
            const pokemon = list.results[i];
            const byNameUrl = `${BASE_URL}/pokemon/${pokemon.name}`;
            const byNameKey = toCacheKey(byNameUrl);
            const byNameExists = await redisClient.exists(byNameKey);

            if (byNameExists) {
                console.log(`⚡ Pokemon ${pokemon.name} already cached by name (${i + 1}/${total})`);
                continue;
            }

            try {
                const pokemonData = await fetchWithRetry(pokemon.url);
                await redisClient.set(byNameKey, JSON.stringify(pokemonData), {
                    EX: CACHE_TTL_SECONDS
                });

                const pokemonId = extractPokemonId(pokemon.url);
                if (pokemonId) {
                    const byIdKey = toCacheKey(`${BASE_URL}/pokemon/${pokemonId}`);
                    await redisClient.set(byIdKey, JSON.stringify(pokemonData), {
                        EX: CACHE_TTL_SECONDS
                    });
                }

                const legacyUrlKey = toCacheKey(pokemon.url);
                await redisClient.set(legacyUrlKey, JSON.stringify(pokemonData), {
                    EX: CACHE_TTL_SECONDS
                });

                console.log(`✅ Cached ${pokemon.name} (name/id/url) (${i + 1}/${total})`);

                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`❌ Failed to cache ${pokemon.name}:`, error);
            }
        }

        console.log("🎉 Successfully warmed up all Pokemon data!");
    } catch (error) {
        console.error("❌ Error during warm-up:", error);
    } finally {
        await redisClient.quit();
    }
}

warmCache().catch(console.error);
