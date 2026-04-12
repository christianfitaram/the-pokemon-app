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

  const savePokemon = useCallback((name: string) => {
    const url = getUrl(name);
    let stored: Pokemon[] = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      stored = [];
    }
    const updated: Pokemon[] = [
      { name, url, viewedAt: Date.now() },
      ...stored.filter((p) => p.name !== name),
    ].slice(0, limit);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecent(updated);
  }, [limit]);

  return { recent, savePokemon };
};

function getUrl(name: string) {
  const prePath = "/pokemon/";
  if (typeof window === "undefined") {
    // Server side: use absolute URL from env variable
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return base + prePath + name;
  }
  // Client side: relative URL
  return prePath + name;
}
