import { capitalizeFirstLetter } from "@/app/utils/functions";
import { useEffect, useState } from "react";
import { Pokemon, PokemonDetailsRandom } from "@/types/types";
import Link from "next/link";
import { typeGradients } from "@/app/utils/typeColors";

interface PokemonCardProps {
  pokemonOverview: Pokemon;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemonOverview }, key) => {
  const [randomPokemons, setRandomPokemons] =
    useState<PokemonDetailsRandom | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonOverview.url) return;

    const fetchPokemonDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${pokemonOverview.url}`);
        if (!res.ok) {
          throw new Error("Failed to fetch Pokémon details");
        }
        const data = await res.json();
        setRandomPokemons(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [pokemonOverview.url]);

  // Get the first type of the Pokémon
  const primaryType = randomPokemons?.types?.[0]?.type?.name || "normal";
  const gradientClass = typeGradients[primaryType] || typeGradients["normal"];

  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };
  return (
    <Link
      href={`/details/${randomPokemons?.name}`}
      className="relative flex flex-col items-center justify-center text-center 
        w-full h-full p-6  rounded-tr-3xl rounded-bl-3xl shadow 
        hover:bg-gray-100 dark:background-muted dark:border-gray-700 dark:hover:bg-gray-700 
        background-muted overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105"
    >
      {/* Left Half Gradient Background with Dim Overlay */}
      <div
        className={`absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l ${gradientClass} opacity-75rounded-tr-3xl rounded-bl-3xl pt-2`}
      >
        EXP: {randomPokemons?.base_experience}
      </div>

      {/* Semi-Transparent Dark Overlay to Further Dim */}
      <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

      <div className="flex flex-col items-center justify-center h-full relative z-10">
        {randomPokemons?.sprites?.other["official-artwork"].front_default && (
          <img
            src={randomPokemons.sprites.other["official-artwork"].front_default}
            alt={randomPokemons?.name}
            className="w-40 h-40 object-contain mx-auto"
          />
        )}
        <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-100  font-[family-name:var(--font-geist-mono)]">
          {randomPokemons?.name.toUpperCase()}
        </h5>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap justify-center">
            {randomPokemons?.types?.map((type, typeIndex) => (
              <span
                key={typeIndex}
                className="bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded-md"
              >
                {capitalizeFirstLetter(type.type.name)}
              </span>
            ))}
          </div>
          {pokemonOverview.viewedAt && (
            <div className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md">
              Viewed {formatDateTime(pokemonOverview.viewedAt)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PokemonCard;
