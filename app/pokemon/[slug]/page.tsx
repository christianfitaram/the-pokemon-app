import PokemonDetailsPage from "@/components/pokemon-details/PokemonDetailsPage";
import type { Metadata } from "next";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import { cache } from "react";

const getPokemonBySlug = cache(async (slug: string) => {
  return PokemonRepository.getPokemonByName(slug);
});

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const initialPokemon = await getPokemonBySlug(slug).catch(() => null);
  return <PokemonDetailsPage number={slug} initialPokemon={initialPokemon} />;
}

// Tell Next.js to treat this as a dynamic route
export const dynamic = "force-static";
export const dynamicParams = true;

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const pokemon = await getPokemonBySlug(slug);
    if (pokemon) {
      const pokemonName = capitalizeFirstLetter(pokemon.name);
      const types = pokemon.types
        .map((type) => capitalizeFirstLetter(type.type.name))
        .join(", ");

      return {
        title: `${pokemonName} - Pokemon Details | The Pokemon App`,
        description: `Discover ${pokemonName}, a ${types} type Pokemon. Height: ${
          pokemon.height / 10
        }m, Weight: ${
          pokemon.weight / 10
        }kg. Explore stats, evolution chain, and chat with ${pokemonName}!`,
        keywords: [
          `${pokemonName}`,
          "pokemon",
          types,
          "evolution",
          "stats",
        ],
        openGraph: {
          title: `${pokemonName} - Pokemon Details`,
          description: `Discover ${pokemonName}, a ${types} type Pokemon with detailed information and interactive features.`,
          images: [
            {
              url:
                pokemon.sprites.other["official-artwork"].front_default ||
                pokemon.sprites.front_default,
              width: 475,
              height: 475,
              alt: `${pokemonName} official artwork`,
            },
          ],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: `${pokemonName} - Pokemon Details`,
          description: `Discover ${pokemonName}, a ${types} type Pokemon with detailed information and interactive features.`,
          images: [
            pokemon.sprites.other["official-artwork"].front_default ||
              pokemon.sprites.front_default,
          ],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata for Pokemon:", error);
  }

  // Fallback metadata if Pokemon data cannot be fetched
  return {
    title: `${capitalizeFirstLetter(slug)} - Pokemon Details | The Pokemon App`,
    description: `Discover ${capitalizeFirstLetter(
      slug
    )}, a Pokemon with detailed information, evolution chain, and interactive features.`,
  };
}
