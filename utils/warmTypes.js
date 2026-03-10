const { createClient } = require("redis");
require("dotenv").config();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const BASE_URL = "https://pokeapi.co/api/v2";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

function toCacheKey(url) {
  return `pokeapi:${url}`;
}

async function warmTypes() {
  await redis.connect();

  for (const type of POKEMON_TYPES) {
    const typeUrl = `${BASE_URL}/type/${type}`;
    const cacheKey = toCacheKey(typeUrl);
    const exists = await redis.exists(cacheKey);

    if (exists) {
      console.log(`Type '${type}' is already cached. Skipping.`);
      continue;
    }

    const res = await fetch(typeUrl);
    const data = await res.json();

    await redis.set(cacheKey, JSON.stringify(data), {
      EX: CACHE_TTL_SECONDS,
    });

    console.log(`Cached type '${type}' (${data.pokemon.length} Pokemon)`);
  }

  await redis.quit();
  console.log("Done warming all types");
}

warmTypes().catch((err) => {
  console.error("Error warming types:", err);
  redis.quit();
});
