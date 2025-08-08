// @ts-ignore
const { createClient } = require("redis");
// @ts-ignore
const fetch = (...args: any[]) => import("node-fetch").then(mod => mod.default(...args));

const redis = createClient({ url: "redis://localhost:6379" });

const POKEMON_TYPES = [
    "normal", "fire", "water", "grass", "electric", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

async function warmTypes() {
    await redis.connect();

    for (const type of POKEMON_TYPES) {
        const cacheKey = `type:${type}`;
        const exists = await redis.exists(cacheKey);

        if (exists) {
            console.log(`⚠️ Type '${type}' is already cached. Skipping.`);
            continue;
        }

        const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const data = await res.json();
        const pokemons = data.pokemon.map((entry: any) => entry.pokemon);

        await redis.set(cacheKey, JSON.stringify(pokemons), {
            EX: 60 * 60 * 24 * 7, // 7 days
        });

        console.log(`✅ Cached type '${type}' with ${pokemons.length} Pokémon`);
    }

    await redis.quit();
    console.log("🏁 Done warming all types.");
}

warmTypes().catch((err) => {
    console.error("❌ Error warming types:", err);
    redis.quit();
});
