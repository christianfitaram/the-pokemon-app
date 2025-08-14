import { Pokemon } from "@/types/interfaces";
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

  const savePokemon = (name: string) => {
    const formatURL = getUrl(name);
    const stored: Pokemon[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    const updated: Pokemon[] = [
      { name, formatURL, viewedAt: Date.now() },
      ...stored.filter((p) => p.name !== name),
    ].slice(0, limit);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecent(updated); // Update state
  };

  return { recent, savePokemon };
};

function getUrl(name: string) {
  const prePath = "/pokemons/pokemon/";
  if (typeof window === "undefined") {
    // Server side: use absolute URL from env variable
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return base + prePath + name;
  }
  // Client side: relative URL
  return prePath + name;
}
