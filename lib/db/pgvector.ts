import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.DB_USER || "pokemon_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "pokedb",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});
