const redisLib = require("redis");
// @ts-ignore
const fetch = (...args: any[]) => import("node-fetch").then(mod => mod.default(...args));
require("dotenv").config();

interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        name: string;
        url: string;
    }[];
}

const redisClient = redisLib.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

const BASE_URL = "https://pokeapi.co/api/v2";

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
        const listKey = "pokeapi:/api/v2/pokemon?limit=1302";
        const listExists = await redisClient.exists(listKey);
        
        if (!listExists) {
            console.log("Warming up Pokemon list...");
            const pokemonList = await fetchWithRetry(`${BASE_URL}/pokemon?limit=1302`);
            await redisClient.set(listKey, JSON.stringify(pokemonList), {
                EX: 60 * 60 * 24 * 7 // 7 days
            });
            console.log("✅ Pokemon list cached");
        }

        const list = await fetchWithRetry(`${BASE_URL}/pokemon?limit=1302`) as PokemonListResponse;
        const total = list.results.length;
        
        console.log(`Found ${total} Pokemon to cache`);

        for (let i = 0; i < list.results.length; i++) {
            const pokemon = list.results[i];
            const pokemonKey = `pokeapi:${pokemon.url}`;
            const exists = await redisClient.exists(pokemonKey);

            if (exists) {
                console.log(`⚡ Pokemon ${pokemon.name} already cached (${i + 1}/${total})`);
                continue;
            }

            try {
                const pokemonData = await fetchWithRetry(pokemon.url);
                await redisClient.set(pokemonKey, JSON.stringify(pokemonData), {
                    EX: 60 * 60 * 24 * 7 // 7 days
                });
                console.log(`✅ Cached ${pokemon.name} (${i + 1}/${total})`);

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
