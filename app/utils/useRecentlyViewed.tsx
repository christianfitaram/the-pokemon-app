import { Pokemon } from "@/types/types";
import { useEffect, useState } from "react";

const STORAGE_KEY = "recentlyViewed";

export const useRecentlyViewed = (limit = 10) => {
  const [recent, setRecent] = useState<Pokemon[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecent(JSON.parse(stored));
    }
  }, []);

  const savePokemon = (name: string, url:string) => {
    const stored: Pokemon[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    const updated: Pokemon[] = [
      {name, url, viewedAt: Date.now() },
      ...stored.filter((p) => p.name !== name),
    ].slice(0, limit);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecent(updated); // Update state
  };

  return { recent, savePokemon };
};
