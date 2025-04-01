"use client";
import { getRandomNumber } from "@/app/utils/functions";
import {
  PokemonTypeResponse,
  Pokemon,
  PokemonDetailsRandom,
  Response,
  PokemonDetails,
} from "@/types/types";


export const fetchRandomPokemon = async (): Promise<string | null> => {
  const number = getRandomNumber();
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${number}`);
    if (!res.ok) {
      fetchRandomPokemon;
    }
    const data: PokemonDetails = await res.json();
    return data.name; //Only return the relevant part
  } catch (error) {
    console.log(error);
    return null; //Return an empty array if an error occurs
  }
};

export const getLastPage = async (n: number): Promise<string> => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${n}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch Pokémon: ${res.statusText}`);
    }
    const data = await res.json();

    return data.previous || ""; // ✅ Return the last page URL correctly
  } catch (error) {
    console.error("Error fetching last page:", error);
    return "";
  }
};

export const fetchPokemon = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const data: PokemonTypeResponse = await res.json();
    return data.pokemon; //Only return the relevant part
  } catch (error) {
    console.log(error);
    return []; //Return an empty array if an error occurs
  }
};
