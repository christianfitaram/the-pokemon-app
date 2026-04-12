#!/usr/bin/env node

require("dotenv").config();
const { Pool } = require("pg");
const OpenAI = require("openai");

// ============================================================================
// Configuration
// ============================================================================

const DB_CONFIG = {
  user: process.env.DB_USER || "localuser139",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "pokedb",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5433),
};

const AI_PROVIDER = (process.env.AI_PROVIDER || "").toLowerCase() === "gemini" ? "gemini" : "openai";
const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || (AI_PROVIDER === "gemini" ? "gemini-embedding-001" : "text-embedding-3-small");
const EMBEDDING_DIMENSION_CONFIG = Number(process.env.AI_EMBEDDING_DIM || 0);

let resolvedEmbeddingModel = EMBEDDING_MODEL;
let resolvedEmbeddingDimension = EMBEDDING_DIMENSION_CONFIG;

function createAIClient() {
  if (AI_PROVIDER === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required when AI_PROVIDER=gemini");
    }

    return new OpenAI({
      apiKey: key,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY environment variable is required when AI_PROVIDER=openai");
  }

  return new OpenAI({ apiKey: key });
}

const aiClient = createAIClient();
const pool = new Pool(DB_CONFIG);

const BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 10; // Process Pokemon in batches to avoid rate limits

// ============================================================================
// Utility Functions
// ============================================================================

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429 && attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt);
        console.log(` Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(delay);
    }
  }
}

async function generateEmbedding(text) {
  try {
    const response = await aiClient.embeddings.create({
      input: text,
      model: resolvedEmbeddingModel,
    });
    const vector = response.data[0].embedding;
    if (vector.length !== resolvedEmbeddingDimension) {
      throw new Error(
        `Embedding size mismatch: expected ${resolvedEmbeddingDimension}, got ${vector.length}. Set AI_EMBEDDING_DIM to match your model output.`
      );
    }
    return vector;
  } catch (error) {
    throw new Error(`Failed to generate embedding with model '${resolvedEmbeddingModel}': ${error.message}`);
  }
}

async function resolveEmbeddingConfiguration() {
  const candidates = AI_PROVIDER === "gemini"
    ? [EMBEDDING_MODEL, "gemini-embedding-001", "text-embedding-004"]
    : [EMBEDDING_MODEL];

  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];
  const probeText = "Pokemon embedding probe";
  const errors = [];

  for (const candidate of uniqueCandidates) {
    try {
      const response = await aiClient.embeddings.create({
        input: probeText,
        model: candidate,
      });

      const vector = response.data?.[0]?.embedding;
      if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Embedding API returned an empty vector");
      }

      resolvedEmbeddingModel = candidate;
      if (EMBEDDING_DIMENSION_CONFIG > 0 && EMBEDDING_DIMENSION_CONFIG !== vector.length) {
        console.warn(
          `Warning: AI_EMBEDDING_DIM=${EMBEDDING_DIMENSION_CONFIG} does not match model output dimension ${vector.length}. Using ${vector.length}.`
        );
      }
      resolvedEmbeddingDimension = vector.length;
      return;
    } catch (error) {
      errors.push(`- ${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    `Unable to resolve a working embedding model for provider '${AI_PROVIDER}'.\n${errors.join("\n")}`
  );
}

function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

// ============================================================================
// Database Functions
// ============================================================================

async function createExtension() {
  console.log(" Creating pgvector extension...");
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("pgvector extension ready");
  } catch (error) {
    console.error("Failed to create extension:", error.message);
    throw error;
  }
}

async function createTable() {
  console.log("Ensuring pokemon_embeddings table exists...");
  const canCreateAnnIndex = resolvedEmbeddingDimension <= 2000;
  const embeddingIndexSql = canCreateAnnIndex
    ? "CREATE INDEX idx_pokemon_embedding ON pokemon_embeddings USING ivfflat (embedding vector_cosine_ops);"
    : "";

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS pokemon_embeddings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      name_normalized VARCHAR(100) NOT NULL,
      height_dm INT,
      weight_hg INT,
      types TEXT[] DEFAULT ARRAY[]::TEXT[],
      abilities JSONB,
      stats JSONB,
      color VARCHAR(50),
      habitat VARCHAR(50),
      description TEXT,
      image VARCHAR(500),
      evolution_chain JSONB,
      evolution_tree JSONB,
      embedding vector(${resolvedEmbeddingDimension}),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_pokemon UNIQUE(name_normalized)
    );

    ALTER TABLE pokemon_embeddings ADD COLUMN IF NOT EXISTS height_dm INT;
    ALTER TABLE pokemon_embeddings ADD COLUMN IF NOT EXISTS weight_hg INT;

    CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon_embeddings(name_normalized);
    ${embeddingIndexSql}
  `;

  try {
    await pool.query(createTableSQL);
    if (!canCreateAnnIndex) {
      console.warn(
        `Warning: Skipped ANN index creation because embedding dimension ${resolvedEmbeddingDimension} exceeds pgvector index limits (max 2000).`
      );
    }
    console.log("Table created successfully");
  } catch (error) {
    console.error("Failed to create table:", error.message);
    throw error;
  }
}

async function getExistingPokemonNames() {
  const { rows } = await pool.query(
    "SELECT name_normalized FROM pokemon_embeddings WHERE height_dm IS NOT NULL AND weight_hg IS NOT NULL"
  );
  return new Set(rows.map((row) => row.name_normalized));
}

async function insertPokemon(pokemonData) {
  const {
    name,
    name_normalized,
    height_dm,
    weight_hg,
    types,
    abilities,
    stats,
    color,
    habitat,
    description,
    image,
    evolution_chain,
    evolution_tree,
    embedding,
  } = pokemonData;

  const insertSQL = `
    INSERT INTO pokemon_embeddings (
      name, name_normalized, height_dm, weight_hg, types, abilities, stats, color, habitat, 
      description, image, evolution_chain, evolution_tree, embedding
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (name_normalized) DO UPDATE
    SET
      height_dm = EXCLUDED.height_dm,
      weight_hg = EXCLUDED.weight_hg,
      types = EXCLUDED.types,
      abilities = EXCLUDED.abilities,
      stats = EXCLUDED.stats,
      color = EXCLUDED.color,
      habitat = EXCLUDED.habitat,
      description = EXCLUDED.description,
      image = EXCLUDED.image,
      evolution_chain = EXCLUDED.evolution_chain,
      evolution_tree = EXCLUDED.evolution_tree,
      embedding = EXCLUDED.embedding;
  `;

  try {
    const result = await pool.query(insertSQL, [
      name,
      name_normalized,
      height_dm,
      weight_hg,
      types,
      JSON.stringify(abilities),
      JSON.stringify(stats),
      color,
      habitat,
      description,
      image,
      JSON.stringify(evolution_chain),
      JSON.stringify(evolution_tree),
      JSON.stringify(embedding),
    ]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Failed to insert ${name}:`, error.message);
    throw error;
  }
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function fetchAllPokemon() {
  console.log("🔍 Fetching all Pokemon list...");
  const allPokemonUrl = `${BASE_URL}/pokemon?limit=1302`;
  const data = await fetchWithRetry(allPokemonUrl);
  return data.results;
}

async function fetchPokemonDetails(pokemonName) {
  const url = `${BASE_URL}/pokemon/${pokemonName}`;
  return await fetchWithRetry(url);
}

async function fetchSpeciesDetails(speciesName) {
  const url = `${BASE_URL}/pokemon-species/${speciesName}`;
  return await fetchWithRetry(url);
}

async function fetchEvolutionChain(chainUrl) {
  return await fetchWithRetry(chainUrl);
}

async function fetchAbility(abilityName) {
  const url = `${BASE_URL}/ability/${abilityName}`;
  return await fetchWithRetry(url);
}

// ============================================================================
// Data Processing Functions
// ============================================================================

function extractTypes(pokemonData) {
  return pokemonData.types.map((t) => t.type.name);
}

function extractAbilities(pokemonData) {
  return pokemonData.abilities.map((a) => ({
    name: a.ability.name,
    is_hidden: a.is_hidden,
    slot: a.slot,
  }));
}

function extractStats(pokemonData) {
  return pokemonData.stats.reduce(
    (acc, stat) => {
      acc[stat.stat.name] = stat.base_stat;
      return acc;
    },
    {}
  );
}

function pickEnglishEntry(entries, field = "name") {
  if (!entries || entries.length === 0) return null;
  const englishEntry = entries.find((entry) => entry.language?.name === "en");
  return englishEntry?.[field] || entries[0]?.[field] || null;
}

function extractFlavorText(speciesData) {
  const entries = speciesData.flavor_text_entries || [];
  let flavorText = pickEnglishEntry(entries, "flavor_text");
  if (flavorText) {
    flavorText = flavorText.replace(/\s+/g, " ").trim();
  }
  return flavorText || "";
}

function extractGenus(speciesData) {
  const genera = speciesData.genera || [];
  return pickEnglishEntry(genera, "genus") || "";
}

function normalizeEvolutionChain(evolutionNode) {
  if (!evolutionNode) return [];

  const chain = [];
  let current = evolutionNode;

  while (current) {
    chain.push(current.species?.name || "unknown");
    current = current.evolves_to?.[0] || null;
  }

  return chain;
}

function buildEvolutionTree(evolutionNode) {
  if (!evolutionNode) return null;

  return {
    name: evolutionNode.species?.name || "unknown",
    evolves_to: (evolutionNode.evolves_to || []).map((e) => buildEvolutionTree(e)),
  };
}

// ============================================================================
// Main ETL Pipeline
// ============================================================================

async function enrichPokemonData(pokemonName, pokemonData) {
  try {
    // Fetch species data using canonical species name (forms like deoxys-attack map to deoxys)
    const speciesName = pokemonData?.species?.name || pokemonName;
    const speciesData = await fetchSpeciesDetails(speciesName).catch(async () => {
      if (speciesName !== pokemonName) {
        // Fallback when canonical species is unavailable for any reason.
        return fetchSpeciesDetails(pokemonName);
      }
      throw new Error(`Unable to resolve species for ${pokemonName}`);
    });

    // Fetch evolution chain
    let evolutionChain = [];
    let evolutionTree = null;
    if (speciesData.evolution_chain?.url) {
      const evolutionData = await fetchEvolutionChain(
        speciesData.evolution_chain.url
      );
      evolutionChain = normalizeEvolutionChain(evolutionData.chain);
      evolutionTree = buildEvolutionTree(evolutionData.chain);
    }

    // Extract description
    const description = extractFlavorText(speciesData);
    const genus = extractGenus(speciesData);

    // Compose embedding text
    const embeddingText = `${pokemonName} ${genus} ${description} types: ${pokemonData.types.map((t) => t.type.name).join(", ")}`.substring(
      0,
      8191
    ); // OpenAI limit

    // Generate embedding
    console.log(`   Generating embedding for ${pokemonName}...`);
    const embedding = await generateEmbedding(embeddingText);

    return {
      name: pokemonData.name,
      name_normalized: normalizeName(pokemonData.name),
      height_dm: Number.isFinite(pokemonData.height) ? pokemonData.height : null,
      weight_hg: Number.isFinite(pokemonData.weight) ? pokemonData.weight : null,
      types: extractTypes(pokemonData),
      abilities: extractAbilities(pokemonData),
      stats: extractStats(pokemonData),
      color: speciesData.color?.name || "unknown",
      habitat: speciesData.habitat?.name || "unknown",
      description,
      image:
        pokemonData.sprites?.other?.["official-artwork"]?.front_default ||
        pokemonData.sprites?.front_default ||
        "",
      evolution_chain: evolutionChain,
      evolution_tree: evolutionTree,
      embedding,
    };
  } catch (error) {
    console.error(
      `    Error enriching ${pokemonName}:`,
      error.message
    );
    return null;
  }
}

async function processPokemonBatch(pokemonList, startIdx, batchSize, existingNames) {
  const batch = pokemonList.slice(startIdx, startIdx + batchSize);
  const enrichedBatch = [];
  let skippedExisting = 0;

  for (const pokemon of batch) {
    const normalized = normalizeName(pokemon.name);
    if (existingNames.has(normalized)) {
      skippedExisting += 1;
      continue;
    }

    try {
      const pokemonData = await fetchPokemonDetails(pokemon.name);
      const enrichedData = await enrichPokemonData(
        pokemon.name,
        pokemonData
      );

      if (enrichedData) {
        enrichedBatch.push(enrichedData);
      }

      // Rate limiting
      await sleep(500);
    } catch (error) {
      console.error(
        `    Error processing ${pokemon.name}:`,
        error.message
      );
    }
  }

  // Insert batch into database
  let inserted = 0;
  for (const data of enrichedBatch) {
    const wasInserted = await insertPokemon(data);
    if (wasInserted) {
      inserted += 1;
      existingNames.add(data.name_normalized);
    }
  }

  return { inserted, skippedExisting };
}

async function main() {
  console.log("Starting Pokemon pgvector database initialization...\n");
  await resolveEmbeddingConfiguration();
  console.log(`AI provider: ${AI_PROVIDER}`);
  console.log(`Embedding model: ${resolvedEmbeddingModel}`);
  console.log(`Embedding dimension: ${resolvedEmbeddingDimension}\n`);

  try {
    // Step 1: Connect to database
    console.log("Connecting to PostgreSQL...");
    await pool.query("SELECT NOW()");
    console.log("Connected to database\n");

    // Step 2: Create pgvector extension
    await createExtension();
    console.log();

    // Step 3: Create table
    await createTable();
    console.log();

    // Step 4: Fetch all Pokemon and filter existing records
    const pokemonList = await fetchAllPokemon();
    console.log(`Found ${pokemonList.length} Pokemon\n`);

    const existingNames = await getExistingPokemonNames();
    console.log(`Existing records in table: ${existingNames.size}`);

    const pendingPokemon = pokemonList.filter(
      (pokemon) => !existingNames.has(normalizeName(pokemon.name))
    );

    if (pendingPokemon.length === 0) {
      console.log("No missing Pokemon to insert. Table is up to date.");
      return;
    }

    console.log(`Missing Pokemon to process: ${pendingPokemon.length}\n`);

    // Step 5: Process in batches
    console.log(`Processing ${pendingPokemon.length} Pokemon in batches...\n`);

    let totalInserted = 0;
    let totalSkippedExisting = 0;
    let totalBatches = Math.ceil(pendingPokemon.length / BATCH_SIZE);

    for (let i = 0; i < pendingPokemon.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(
        ` Batch ${batchNum}/${totalBatches} (Pokemon ${i + 1}-${Math.min(
          i + BATCH_SIZE,
          pendingPokemon.length
        )})`
      );

      const batchResult = await processPokemonBatch(
        pendingPokemon,
        i,
        BATCH_SIZE,
        existingNames
      );
      totalInserted += batchResult.inserted;
      totalSkippedExisting += batchResult.skippedExisting;

      console.log(`   Inserted ${batchResult.inserted} Pokemon (skipped existing in batch: ${batchResult.skippedExisting})\n`);

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < pendingPokemon.length) {
        console.log("Waiting before next batch...");
        await sleep(2000);
      }
    }

    console.log(`\nTotal inserted in this run: ${totalInserted}`);
    console.log(`Total skipped as existing in this run: ${totalSkippedExisting}`);

    // Step 6: Verify data
    console.log("\n Verifying data insertion...");
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM pokemon_embeddings"
    );
    const count = result.rows[0].count;

    console.log(` Successfully inserted ${count} Pokemon records`);

    // Step 7: Show sample data
    console.log("\n Sample records:");
    const samples = await pool.query(
      "SELECT name, height_dm, weight_hg, types, color, habitat FROM pokemon_embeddings LIMIT 3"
    );
    samples.rows.forEach((row) => {
      console.log(
        `  - ${row.name}: height=${row.height_dm}dm, weight=${row.weight_hg}hg, types=[${row.types.join(", ")}], color=${row.color}, habitat=${row.habitat}`
      );
    });

    console.log("\n Database initialization complete!");
  } catch (error) {
    console.error(" Fatal error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ============================================================================
// Run
// ============================================================================

main().catch((error) => {
  console.error(" Unhandled error:", error);
  process.exit(1);
});
