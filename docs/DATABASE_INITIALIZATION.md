# pgvector Database Initialization Script

## Overview

`init-pgvector-db.js` is a comprehensive Node.js script that:

1. **Creates the pgvector extension** in PostgreSQL
2. **Initializes the schema** with the `pokemon_embeddings` table
3. **Fetches all Pokemon data** from PokeAPI
4. **Enriches Pokemon records** with:
   - OpenAI vector embeddings (1536-dimensional)
   - Species information (color, habitat, description)
   - Evolution chains and trees
   - Stats, abilities, and types
5. **Populates the database** with ~1,025 Pokemon records

---

## Prerequisites

### 1. PostgreSQL Setup

Ensure PostgreSQL is running and you have a database created:

```bash
# Create database and user (one-time)
psql -U postgres -c "CREATE DATABASE pokedb;"
psql -U postgres -c "CREATE USER pokemon_user WITH PASSWORD 'your-secure-password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pokedb TO pokemon_user;"
```

### 2. Environment Variables

Create or update `.env.local` with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=pokemon_user
DB_PASSWORD=your-secure-password
DB_NAME=pokedb

# OpenAI API (required for embeddings)
OPENAI_API_KEY=sk-...
```

### 3. Dependencies

Install required npm packages (already in package.json):
- `pg` — PostgreSQL client
- `openai` — OpenAI API client
- `dotenv` — Environment variable loader

---

## Usage

### Quick Start

```bash
npm run init:db
```

### What Happens

The script runs through 5 phases:

#### Phase 1: Setup
- ✅ Connects to PostgreSQL
- ✅ Creates pgvector extension
- ✅ Drops and recreates `pokemon_embeddings` table

#### Phase 2: Schema Creation
Table structure:
```sql
CREATE TABLE pokemon_embeddings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_normalized VARCHAR(100) NOT NULL,
  types TEXT[],
  abilities JSONB,
  stats JSONB,
  color VARCHAR(50),
  habitat VARCHAR(50),
  description TEXT,
  image VARCHAR(500),
  evolution_chain JSONB,
  evolution_tree JSONB,
  embedding vector(1536),  -- OpenAI embeddings
  created_at TIMESTAMP,
  CONSTRAINT unique_pokemon UNIQUE(name_normalized)
);

-- Indexes for performance
CREATE INDEX idx_pokemon_name ON pokemon_embeddings(name_normalized);
CREATE INDEX idx_pokemon_embedding ON pokemon_embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### Phase 3: Data Fetching
- Fetches full Pokemon list from PokeAPI (~1,025 records)
- Processes in batches of 10 to respect rate limits

#### Phase 4: Enrichment (Per Pokemon)
For each Pokemon:
1. Fetch base stats, types, abilities from `/pokemon/{id}`
2. Fetch species data from `/pokemon-species/{id}`
3. Fetch evolution chain from `/evolution-chain/{id}`
4. Extract and normalize:
   - Types: ["fire", "flying"]
   - Abilities: [{name: "blaze", is_hidden: false, slot: 1}]
   - Stats: {hp: 78, attack: 84, defense: 78, ...}
   - Description: Pokedex flavor text (English)
   - Evolution chain: ["charmander", "charmeleon", "charizard"]
5. **Generate embedding** using OpenAI `text-embedding-3-small`
   - Input: "{name} {genus} {description} types: {types}"
   - Output: 1536-dimensional vector

#### Phase 5: Insertion
- Batches inserts for performance
- Skips duplicates (name_normalized constraint)
- Provides progress updates

---

## Expected Output

```
🚀 Starting Pokemon pgvector database initialization...

🔗 Connecting to PostgreSQL...
✅ Connected to database

📦 Creating pgvector extension...
✅ pgvector extension ready

📋 Creating pokemon_embeddings table...
✅ Table created successfully

🔍 Fetching all Pokemon list...
✅ Found 1025 Pokemon

⚙️  Processing 1025 Pokemon in batches...

📦 Batch 1/103 (Pokemon 1-10)
   📝 Generating embedding for bulbasaur...
   ✅ Inserted 10 Pokemon

📦 Batch 2/103 (Pokemon 11-20)
   📝 Generating embedding for ivysaur...
   ✅ Inserted 10 Pokemon

... [97 more batches] ...

📊 Verifying data insertion...
✅ Successfully inserted 1025 Pokemon records

📋 Sample records:
  - bulbasaur: types=[grass, poison], color=green, habitat=grassland
  - ivysaur: types=[grass, poison], color=green, habitat=grassland
  - venusaur: types=[grass, poison], color=green, habitat=grassland

🎉 Database initialization complete!
```

**Total Time:** ~30-45 minutes (depends on API rate limits and network)

---

## Key Features

### ✅ Batch Processing
- Processes Pokemon in batches of 10
- Includes rate limit handling with exponential backoff
- Delays between batches to avoid throttling

### ✅ Robust Error Handling
- Retries failed API calls up to 3 times
- Graceful fallback for embedding failures
- Continues processing despite individual errors

### ✅ Progress Tracking
- Real-time console output
- Batch-level reporting
- Final verification query

### ✅ Idempotent
- `ON CONFLICT DO NOTHING` prevents duplicates
- Safe to re-run without manual cleanup
- Drops and recreates table automatically

---

## Data Schema Details

### Column Types & Contents

| Column | Type | Example |
|--------|------|---------|
| `name` | VARCHAR | "bulbasaur" |
| `name_normalized` | VARCHAR | "bulbasaur" (lowercase, no spaces) |
| `types` | TEXT[] | `["grass", "poison"]` |
| `abilities` | JSONB | `[{"name":"overgrow", "is_hidden":false, "slot":1}]` |
| `stats` | JSONB | `{"hp":45, "attack":49, "defense":49, ...}` |
| `color` | VARCHAR | "green" |
| `habitat` | VARCHAR | "grassland" |
| `description` | TEXT | "A strange seed was planted..." |
| `image` | VARCHAR | "https://raw.githubusercontent.com/..." |
| `evolution_chain` | JSONB | `["bulbasaur", "ivysaur", "venusaur"]` |
| `evolution_tree` | JSONB | `{name: "bulbasaur", evolves_to: [{name: "ivysaur", ...}]}` |
| `embedding` | vector(1536) | `[0.023, -0.015, 0.042, ...]` |

---

## Queries After Population

### Find Pokemon by Semantic Similarity
```sql
-- Find Pokemon similar to "fast electric types"
WITH query_embedding AS (
  SELECT embedding FROM (
    SELECT '[0.023, -0.015, ...]'::vector as embedding
  ) t
)
SELECT name, types, color, embedding <-> (SELECT embedding FROM query_embedding) AS distance
FROM pokemon_embeddings
ORDER BY distance
LIMIT 5;
```

### Find Pokemon by Normalized Name
```sql
SELECT name, types, abilities, stats
FROM pokemon_embeddings
WHERE name_normalized = 'pikachu';
```

### Find Evolution Chain
```sql
SELECT name, evolution_chain, evolution_tree
FROM pokemon_embeddings
WHERE name = 'charmander';
```

---

## Troubleshooting

### Error: `OPENAI_API_KEY is not configured`
- Set `OPENAI_API_KEY` in `.env.local`
- Ensure the key is valid and has sufficient quota

### Error: `connect ECONNREFUSED 127.0.0.1:5432`
- PostgreSQL is not running
- Start: `brew services start postgresql` (macOS)
- Or: `systemctl start postgresql` (Linux)

### Error: `permission denied for schema public`
- User permissions issue
- Run: `GRANT ALL ON SCHEMA public TO pokemon_user;`

### Error: `could not load library "vector"`
- pgvector extension not installed in PostgreSQL
- Install: `CREATE EXTENSION IF NOT EXISTS vector;` (in admin terminal)

### Slow Processing / Rate Limits
- Script includes exponential backoff and delays
- Expected runtime: 30-45 minutes for 1,025 Pokemon
- Can adjust `BATCH_SIZE` and delays in script if needed

---

## IVFFLAT Index

The script creates an IVFFLAT index for fast approximate nearest neighbor search:

```sql
CREATE INDEX idx_pokemon_embedding ON pokemon_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

**Why IVFFLAT?**
- ✅ Fast ANN queries (milliseconds for top-5)
- ✅ Low memory overhead
- ✅ Suitable for 1,025 vectors in 1536 dimensions

**Alternative:** HNSW index (better for larger datasets)
```sql
CREATE INDEX idx_pokemon_embedding ON pokemon_embeddings 
USING hnsw (embedding vector_cosine_ops);
```

---

## Next Steps

After successful initialization:

1. **Verify the data:**
   ```bash
   psql -U pokemon_user -d pokedb -c "SELECT COUNT(*) FROM pokemon_embeddings;"
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Test AI endpoints:**
   - Assistant chat: Talk to Pokémon assistant
   - Roleplay chat: Chat with specific Pokémon character

---

## Advanced: Re-initialize Strategy

To completely reset and reinitialize:

```bash
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS pokedb;"

# Recreate and initialize
psql -U postgres -c "CREATE DATABASE pokedb;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pokedb TO pokemon_user;"
npm run init:db
```

---

## Performance Metrics

Expected performance once populated:

| Operation | Time | Notes |
|-----------|------|-------|
| Semantic search (top-5) | <50ms | Uses IVFFLAT index |
| Name lookup | <10ms | Uses B-tree index |
| Evolution chain fetch | <5ms | Direct lookup |
| Full table scan | ~500ms | 1,025 records |
| Database size | ~15MB | ~1536 float32 vectors + metadata |

