import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.DB_USER || "pokemon_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "pokedb",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});
