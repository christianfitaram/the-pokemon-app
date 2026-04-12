import { Pokemon } from "@/types/interfaces";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recentlyViewed";

export const useRecentlyViewed = (limit = 10) => {
  const [recent, setRecent] = useState<Pokemon[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecent(JSON.parse(stored));
      }
    } catch {
      setRecent([]);
    }
  }, []);

  const savePokemon = useCallback((pokemon: Pick<Pokemon, "name" | "id">) => {
    const { name, id } = pokemon;
    const url = getUrl(name, id);
    let stored: Pokemon[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      stored = [];
    }
    const updated: Pokemon[] = [
      { name, id, url, viewedAt: Date.now() },
      ...stored.filter((p) => p.name !== name),
    ].slice(0, limit);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecent(updated);
  }, [limit]);

  return { recent, savePokemon };
};

function getUrl(name: string, id?: number) {
  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    return `https://pokeapi.co/api/v2/pokemon/${id}/`;
  }
  return `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`;
}
