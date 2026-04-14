"use client";
import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { PokemonDetails } from "@/types/interfaces";
import { FaCommentDots, FaHome } from "react-icons/fa";
import PokemonChat from "@/components/chat/PokemonChat";
import { EvolutionCard } from "@/components/pokemon-details/EvolutionCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { motion } from "framer-motion";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";
import { getAverageColor, getColorTheme } from "@/utils/getUIcolors";
import { PokemonTypeList } from "../PokemonTypeCard";
import { uiThemePokemon } from "@/types/uiThemePokemonType";
import { PokemonDetailsSkeleton} from "@/components/layout/Skeletons";
import { SubContainer } from "@/components/layout/GeneralLayout";
import Image from "next/image";
import { SeeAlso } from "./SeeAlso";
import { MainLayout } from "@/components/layout/GeneralLayout";
import {getURLimg} from "@/utils/getURLimg";
import { EnrichedPokemonData } from "@/types/enrichedPokemon";

export default function PokemonDetailsClient({
  number,
  initialPokemon = null,
}: {
  number: string;
  initialPokemon?: PokemonDetails | null;
}) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(initialPokemon);
  const [enrichedPokemon, setEnrichedPokemon] = useState<EnrichedPokemonData | null>(null);
  const [showPokemonChat, setShowPokemonChat] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const router = useRouter();
  const [uiTheme, setUItheme] = useState<uiThemePokemon>();
  const [gradientClass, setGradientClass] = useState<string | null>(null);
    const [imgURL, setImgURL] = useState<string>("/sprites/question-mark.png");
  const { savePokemon } = useRecentlyViewed();

  useEffect(() => {
    if (!number) return;
    let isCancelled = false;

    const fetchPokemonDetails = async () => {
      setLoading(true);
      setEnrichedPokemon(null);
      setErrorMessage(null);

      try {
        const normalizedNumber = number.toLowerCase();
        const pokemonForPage =
          initialPokemon?.name.toLowerCase() === normalizedNumber
            ? initialPokemon
            : null;

        const pokemonResponse = pokemonForPage
          ? { success: true, data: pokemonForPage }
          : await PokemonApiClient.getPokemonByName(number);

        if (!pokemonResponse.success || !pokemonResponse.data) {
          if (!isCancelled) {
            const errorText = pokemonResponse.error || "Unable to load Pokemon details";
            const isNotFoundError = errorText.includes("404");
            if (!isNotFoundError) {
              setErrorMessage(errorText);
            }
            setPokemon(null);
            setEnrichedPokemon(null);
          }
          return;
        }

        if (!isCancelled) {
          setPokemon(pokemonResponse.data);
          savePokemon({ name: pokemonResponse.data.name, id: pokemonResponse.data.id });
        }

        const enrichedResponse = await PokemonApiClient.getEnrichedPokemonById(pokemonResponse.data.id);
        if (isCancelled) return;
        if (enrichedResponse.success && enrichedResponse.data) {
          setEnrichedPokemon(enrichedResponse.data);
        } else {
          setEnrichedPokemon(null);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch Pokemon details", error);
          setErrorMessage("Could not load Pokemon details. Please retry.");
          setPokemon(null);
          setEnrichedPokemon(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchPokemonDetails();
    return () => {
      isCancelled = true;
    };
  }, [number, savePokemon, initialPokemon, retryNonce]);

  //Lets passing the gradient for the background and UI elements

  useEffect(() => {
    if (pokemon) {
      const getUItheme   = (currentPokemon: PokemonDetails) => {
        setUItheme(getColorTheme(currentPokemon));
      };
      const getGradientColorUI = (currentPokemon: PokemonDetails) => {
        setGradientClass(getAverageColor(currentPokemon));
      };
      getUItheme(pokemon);
      getGradientColorUI(pokemon);
        setImgURL(getURLimg(pokemon))
    }
  }, [pokemon]);
  if (loading) return <PokemonDetailsSkeleton />;
  if (errorMessage) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 mt-8">
          <h2 className="text-2xl font-bold text-white">Pokemon details unavailable</h2>
          <p className="text-gray-300 text-center max-w-lg">{errorMessage}</p>
          <div className="flex flex-row gap-3">
            <button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="border border-gray-400 text-gray-100 px-4 py-2 rounded hover:bg-gray-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }
  if (!pokemon) return notFound();
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-testid="pokemon-details"
        className="flex flex-col items-center space-y-6 gradient min-h-screen gap-10 mt-8"
        style={
          {
            "--gradient-color": uiTheme?.backgroundColor,
          } as React.CSSProperties
        }
      >
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl w-full">
          <div className="flex flex-col">
            <Image
              src={imgURL}
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
                <button
                  type="button"
                  onClick={() => setShowPokemonChat(true)}
                  className={`${gradientClass} rounded-full flex flex-row items-center px-4 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-300`}
                >
                  <span
                    className={`text-white rounded-full text-sm inline-flex justify-center w-fit p-2 `}
                  >
                    <FaCommentDots className="h-5 w-5" />
                  </span>
                  <span>Chat with me </span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className={`text-white rounded-full ${gradientClass} focus:ring-4 focus:outline-none focus:ring-blue-200  hover:opacity-80  text-sm inline-flex justify-center w-fit p-2 mx-2`}
                >
                  <FaHome className="h-5 w-5" />
                  <span className="px-2">Go Home</span>
                </button>
              </div>
              <h5
                className={`mb-2 text-2xl font-bold tracking-tight ${uiTheme?.textColor} flex flex-row justify-center`}
              >
                {pokemon?.name.toUpperCase()}
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
                  <p className="p-2">{(pokemon?.weight / 10).toFixed(1)} kg</p>
                </div>
              </div>
              <p className="text-gray-200">
                Base experience: {pokemon.base_experience}
              </p>
              {enrichedPokemon?.species.flavorText && (
                <p className="text-gray-200 text-sm leading-relaxed">
                  {enrichedPokemon.species.flavorText}
                </p>
              )}
              {enrichedPokemon?.abilities.length ? (
                <div className="text-gray-200 text-sm">
                  <p className="font-semibold">Abilities</p>
                  <p>
                    {enrichedPokemon.abilities
                      .map((ability) => ability.name.replace(/-/g, " "))
                      .join(", ")}
                  </p>
                </div>
              ) : null}
              <PokemonTypeList pokemon={pokemon} />
            </div>
          )}
        </div>
        <SubContainer>
          {pokemon && enrichedPokemon && (
            <EvolutionCard
              name={pokemon.name}
              enrichedNodes={enrichedPokemon?.evolution.nodes}
            />
          )}
          <SeeAlso types={pokemon.types} />
        </SubContainer>
      </motion.div>
    </MainLayout>
  );
}
