"use client";
import { MainLayout } from "@/components/layout/GeneralLayout";
import { use, useEffect, useState } from "react";
import { Pokemon } from "@/types/interfaces";
import { searchEngine } from "@/lib/searchEngine";
import PokemonCard from "@/components/PokemonCard";
import { motion, AnimatePresence } from "framer-motion";
import { FaHome } from "react-icons/fa";
import Link from "next/link";

export default function PokemonTypesPage({
  params,
}: {
  params: Promise<{ types: string[] }>;
}) {
  const { types } = use(params);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPokemonsByTypes = async () => {
      if (!types || types.length === 0) {
        setError("No types provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use the existing searchEngine utility to fetch Pokémon by types
        const pokemonResults = await searchEngine(types);
        setPokemons(pokemonResults);
      } catch (err) {
        setError("Failed to fetch Pokémon for the selected types");
        console.error("Error fetching Pokémon by types:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonsByTypes();
  }, [types]);

  const formatTypeDisplay = (types: string[]) => {
    return types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(" & ");
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-start min-h-screen w-full">
        {/* Header Section */}
        <div className="w-full max-w-screen-xl px-4 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                Pokémon by Type{types.length > 1 ? 's' : ''}
              </h1>
              <p className="text-gray-300 text-lg">
                {formatTypeDisplay(types)}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Found {pokemons.length} Pokémon
              </p>
            </div>
            
            <Link
              href="/"
              className="border flex flex-row items-center justify-center gap-2 p-3 text-white rounded-lg hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <FaHome className="h-5 w-5" /> Go Home
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full max-w-screen-xl px-4 sm:px-8">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <Link
                href="/"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Return to Home
              </Link>
            </div>
          )}

          {!loading && !error && (
            <AnimatePresence mode="wait">
              {pokemons.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full place-items-stretch"
                >
                  {pokemons.map((pokemon, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <PokemonCard pokemonOverview={pokemon} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-400 text-lg">
                    No Pokémon found for the selected types.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
