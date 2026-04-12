#!/usr/bin/env node

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "pokemon_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "pokedb",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

const BASE_URL = "https://pokeapi.co/api/v2";
const BATCH_SIZE = 25;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429 && attempt < retries) {
        await sleep(delay * Math.pow(2, attempt));
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

async function ensureColumns() {
  await pool.query("ALTER TABLE pokemon_embeddings ADD COLUMN IF NOT EXISTS height_dm INT");
  await pool.query("ALTER TABLE pokemon_embeddings ADD COLUMN IF NOT EXISTS weight_hg INT");
}

async function getRowsNeedingBackfill() {
  const { rows } = await pool.query(
    `SELECT name_normalized, name
     FROM pokemon_embeddings
     WHERE height_dm IS NULL OR weight_hg IS NULL
     ORDER BY name_normalized`
  );
  return rows;
}

async function backfillRow(row) {
  const pokemonUrl = `${BASE_URL}/pokemon/${row.name_normalized}`;
  const pokemonData = await fetchWithRetry(pokemonUrl);

  await pool.query(
    `UPDATE pokemon_embeddings
     SET height_dm = $1,
         weight_hg = $2
     WHERE name_normalized = $3`,
    [pokemonData.height ?? null, pokemonData.weight ?? null, row.name_normalized]
  );
}

async function main() {
  console.log("Starting height/weight migration...");

  try {
    await ensureColumns();

    const pending = await getRowsNeedingBackfill();
    console.log(`Rows needing backfill: ${pending.length}`);

    if (pending.length === 0) {
      console.log("Nothing to migrate.");
      return;
    }

    let processed = 0;
    let updated = 0;

    for (let index = 0; index < pending.length; index += BATCH_SIZE) {
      const batch = pending.slice(index, index + BATCH_SIZE);
      for (const row of batch) {
        try {
          await backfillRow(row);
          updated += 1;
        } catch (error) {
          console.error(`Failed to backfill ${row.name_normalized}:`, error.message);
        }
        processed += 1;
      }

      console.log(`Progress: ${processed}/${pending.length}`);
      if (index + BATCH_SIZE < pending.length) {
        await sleep(500);
      }
    }

    console.log(`Backfill complete. Updated ${updated} rows.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});