"use client";
import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { PokemonDetails } from "@/types/types";
import { FaCommentDots, FaHome } from "react-icons/fa";
import PokemonChat from "@/app/components/chat/PokemonChat";
import { EvolutionCard } from "@/app/components/pokemon-details/EvolutionCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { motion } from "framer-motion";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";
import { getAvergareColor, getColorTheme } from "../../../utils/getUIcolors";
import { PokemonTypeList } from "../PokemonTypeCard";
import { uiThemePokemon } from "@/types/uiThemePokemonType";
import { PokemonDetailsSkeleton, SubContainer } from "./LayoutElements";
import Image from "next/image";
import { SeeAlso } from "./SeeAlso";
import { MainLayout } from "../layout/GeneralLayout";
interface Props {
  number: string;
}

export default function PokemonDetailsClient({ number }: Props) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [showPokemonChat, setShowPokemonChat] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const [uiTheme, setUItheme] = useState<uiThemePokemon>();
  const [gradientClass, setGradientClass] = useState<string | null>(null);

  const { savePokemon } = useRecentlyViewed();

  useEffect(() => {
    if (!number) return;

    const fetchPokemonDetails = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await PokemonApiClient.getPokemonByName(number);

        if (!res.success) {
          throw new Error(res.error || "Failed to fetch Pokémon details");
        }

        if (res.data) {
          setPokemon(res.data);
          savePokemon(number);
        } else {
          throw new Error("No Pokémon data returned");
        }
      } catch (error) {
        setErrorMessage((error as Error).message);
        console.log(errorMessage);
        setPokemon(null);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [number]);
  //Lets assing the gradient for the background and UI elements
  useEffect(() => {
    if (pokemon) {
      const getUItheme = (randomPokemons: PokemonDetails) => {
        setUItheme(getColorTheme(randomPokemons));
      };
      const getGradientColorUI = (randomPokemons: PokemonDetails) => {
        setGradientClass(getAvergareColor(randomPokemons));
      };
      getUItheme(pokemon);
      getGradientColorUI(pokemon);
    }
  }, [pokemon]);
  if (loading) return <PokemonDetailsSkeleton />;
  if (!pokemon)
    return notFound();
  return (
    <MainLayout>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center space-y-6 gradient min-h-screen gap-10"
      style={
        { "--gradient-color": uiTheme?.backgroundColor } as React.CSSProperties
      }
    >
      {loading ? (
        <PokemonDetailsSkeleton />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl w-full">
            <div className="flex flex-col">
              <Image
                src={
                  pokemon?.sprites.other["official-artwork"].front_default ||
                  pokemon?.sprites.front_default ||
                  "/assets/img/question-mark.png"
                }
                alt={pokemon?.name || "Pokemon Image"}
                width={475}
                height={475}
                className="object-contain mx-auto"
              />
            </div>
            {showPokemonChat ? (
              <div className="flex flex-col flex-1 w-fit rounded-3xl max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
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
                  <div
                    onClick={() => setShowPokemonChat(true)}
                    className={`${gradientClass} rounded-full flex flex-row items-center px-4 cursor-pointer hover:opacity-80`}
                  >
                    <button
                      className={`text-white rounded-full focus:ring-4 focus:outline-none focus:ring-blue-200  text-sm inline-flex justify-center w-fit p-2 `}
                    >
                      <FaCommentDots className="h-5 w-5" />
                    </button>
                    <span>Chat with me </span>
                  </div>
                  <button
                    onClick={() => router.push("/")}
                    className={`text-white rounded-full ${gradientClass} focus:ring-4 focus:outline-none focus:ring-blue-200  hover:opacity-80  text-sm inline-flex justify-center w-fit p-2 mx-2`}
                  >
                    <FaHome className="h-5 w-5" />
                    <span className="px-2">Go Home</span>
                  </button>
                </div>
                <h5
                  className={`mb-2 text-2xl font-bold tracking-tight ${uiTheme?.textColor}  ${uiTheme?.textColor}] flex flex-row justify-center`}
                >
                  {pokemon?.name.toLocaleUpperCase()}
                </h5>
                <div className="grid grid-cols-2 w-fit text-gray-200">
                  <div className="border-r border-b border-white">
                    <p className="p-2">Height</p>
                  </div>
                  <div className="border-l border-b border-white">
                    <p className="p-2">{(pokemon?.height / 10).toFixed(1)} m</p>
                  </div>
                  <div className="border-r border-t  border-white">
                    <p className="p-2">Weight</p>
                  </div>
                  <div className="border-l border-t  border-white">
                    <p className="p-2">
                      {(pokemon?.weight / 10).toFixed(1)} kg
                    </p>
                  </div>
                </div>
                <p className="text-gray-200">
                  Base experience: {pokemon.base_experience}
                </p>
                <PokemonTypeList pokemon={pokemon} />
              </div>
            )}
          </div>
          <SubContainer>
            {pokemon && <EvolutionCard name={pokemon.name} />}
            <SeeAlso types={pokemon.types} />
          </SubContainer>
        </>
      )}
    </motion.div>
    </MainLayout>
  );
}
