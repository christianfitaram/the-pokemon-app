"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PokemonDetails } from "@/types/types";
import { FaLongArrowAltLeft, FaCommentDots, FaHome } from "react-icons/fa";
import { typeColors, typeGradients } from "@/app/utils/typeColors";
import { capitalizeFirstLetter } from "@/app/utils/functions";
import PokemonChat from "@/app/components/PokemonChat";
import { EvolutionCard } from "@/app/components/EvolutionCard";
import { useRecentlyViewed } from "@/app/utils/useRecentlyViewed";
import { motion } from "framer-motion";


interface Props {
    number: string;
  }
  
  
export default function PokemonDetailsClient({ number }: Props) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [showPokemonChat, setShowPokemonChat] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const mainType = pokemon?.types[0].type.name || "normal";
  const gradientClass = typeGradients[mainType];
  const gradient = typeColors[mainType] || "from-gray-300 to-gray-500";
  const themeColor = typeColors[mainType + "TW"];
  const textColor = typeColors[mainType + "COLOR"];
  const { savePokemon } = useRecentlyViewed();

  useEffect(() => {
    if (!number) return;

    const fetchPokemonDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${number}`);
        if (!res.ok) {
          throw new Error("Failed to fetch Pokémon details");
        }
        const data = await res.json();
        setPokemon(data);
        savePokemon(number, `https://pokeapi.co/api/v2/pokemon/${number}`);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [number]);
  if (loading) return <PokemonDetailsSkeleton />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center space-y-6 gradient min-h-screen"
      style={{ "--gradient-color": gradient } as React.CSSProperties}
    >
      {loading ? (
        <PokemonDetailsSkeleton />
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl w-full">
            <div className="flex flex-col">
              <img
                src={pokemon?.sprites.other["official-artwork"].front_default}
                alt={pokemon?.name}
              />
            </div>
            {showPokemonChat ? (
              <div className="flex flex-col flex-1 w-fit rounded-3xl">
                {pokemon && (
                  <PokemonChat
                    pokemon={pokemon}
                    onClick={() => setShowPokemonChat(false)}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col  flex-1  background-muted w-fit p-8 rounded-3xl gap-3 ">
                <div className="flex flex-row w-full items-center justify-between">
                  <button
                    onClick={() => setShowPokemonChat(true)}
                    className={`text-white rounded-full   ${themeColor} focus:ring-4 focus:outline-none focus:ring-blue-200  bg-  hover:bg-blue-700   text-sm inline-flex justify-center w-fit p-2 `}
                  >
                    <FaCommentDots className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className={`text-white rounded-full   ${themeColor} focus:ring-4 focus:outline-none focus:ring-blue-200  bg-  hover:bg-blue-700  text-sm inline-flex justify-center w-fit p-2 mx-2`}
                  >
                    <FaHome className="h-5 w-5" /> 
                    <span className="px-2">Go Home</span>
                  </button>
                </div>
                <h5
                  className={`mb-2 text-2xl font-bold tracking-tight ${textColor}  ${textColor}] flex flex-row justify-center`}
                >
                  {pokemon?.name.toLocaleUpperCase()}
                </h5>
                <div className="grid grid-cols-2 w-fit text-gray-200">
                  <div className="border-r border-b  border-white">
                    <p className="p-2">Height</p>
                  </div>
                  <div className="border-l border-b border-white">
                    <p className="p-2">{pokemon?.height}</p>
                  </div>
                  <div className="border-r border-t  border-white">
                    <p className="p-2">Weight</p>
                  </div>
                  <div className="border-l border-t  border-white">
                    <p className="p-2">{pokemon?.weight}</p>
                  </div>
                </div>
                <p className="text-gray-200">Base experience: {pokemon?.base_experience}</p>
                <div className="flex flex-row text-gray-200">
                  <div>
                    <p>TYPES:</p>
                  </div>
                  <hr/>
                </div>
                <div className="flex flex-row gap-2 my-2">
                  {pokemon?.types.map((type) => {
                    const typeName = type.type.name;
                    return (
                      <div
                        key={typeName}
                        className={`flex flex-col w-20 text-white p-2 rounded-3xl items-center gap-4 bg-gray-700`}
                      >
                        <div
                          className="gradient-badge p-2 rounded-full"
                          style={
                            {
                              "--gradient-color": typeColors[typeName],
                            } as React.CSSProperties
                          }
                        >
                          <img
                            src={`/assets/img/icons/${typeName}.svg`}
                            alt={`${typeName} icon`}
                            className="w-5 h-5 "
                          />
                        </div>
                        <div>
                          <p>{capitalizeFirstLetter(typeName)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="w-full max-w-6xl px-4">
            {pokemon && <EvolutionCard name={pokemon?.name} />}
          </div>
        </>
      )}
    </motion.div>
  );
}

const PokemonDetailsSkeleton: React.FC = () => {
    return (
      <div className="flex flex-col items-center space-y-6 min-h-screen animate-pulse">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl w-full px-4">
          {/* Image Placeholder */}
          <div className="w-64 h-64 bg-gray-700 rounded-xl" />
  
          {/* Info Placeholder */}
          <div className="flex flex-col flex-1  background-muted w-fit p-8 rounded-3xl gap-4">
            <div className="flex flex-row w-full items-center justify-between">
              <div className="w-10 h-10 bg-gray-600 rounded-full" />
              <div className="w-10 h-10 bg-gray-600 rounded-full" />
            </div>
  
            <div className="h-6 w-1/3 bg-gray-600 rounded" />
  
            <div className="grid grid-cols-1 w-1/3 gap-2 mt-2">
              <div className="h-10 bg-gray-700 rounded" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
  
            <div className="h-4 w-1/4 bg-gray-700 rounded" />
  
            <div className="h-4 w-1/4 bg-gray-700 rounded mt-4" />
  
            <div className="flex flex-row gap-2 mt-2">
              <div className="w-16 h-10 bg-gray-700 rounded-full" />
              <div className="w-16 h-10 bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4">
          {Array(3)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="relative flex flex-col items-center justify-center text-center 
    w-full h-full p-6 rounded-tr-3xl rounded-bl-3xl shadow 
    background-muted overflow-hidden animate-pulse"
              >
                <div className="absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l from-gray-700 to-gray-900 opacity-40 rounded-tr-3xl rounded-bl-3xl"></div>
                <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>
  
                <div className="flex flex-col items-center justify-center h-full relative z-10 gap-4">
                  <div className="w-40 h-40 bg-gray-700 rounded-xl"></div>
  
                  <div className="w-24 h-4 bg-gray-600 rounded"></div>
  
                  <div className="flex gap-2 flex-wrap justify-center">
                    <div className="w-16 h-4 bg-gray-700 rounded"></div>
                    <div className="w-14 h-4 bg-gray-700 rounded"></div>
                  </div>
  
                  <div className="w-28 h-4 bg-gray-800 rounded"></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };
