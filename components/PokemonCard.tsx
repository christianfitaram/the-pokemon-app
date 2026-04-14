"use client";

import { useEffect, useState } from "react";
import {capitalizeFirstLetter} from "@/utils/capitalizeFirstLetter";
import {Pokemon, PokemonCardProps} from "@/types/interfaces";
import Link from "next/link";
import formatDateTime from "../utils/formatDateTime";
import Image from "next/image";
import { typeGradients } from "@/utils/typeColors";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

type PokemonCardDetails = {
    baseExperience: number | null;
    types: Pokemon["types"];
};

const pokemonCardCache = new Map<string, PokemonCardDetails>();

const extractPokemonId = (pokemon: Pokemon): number | null => {
    if (typeof pokemon.id === "number" && Number.isInteger(pokemon.id) && pokemon.id > 0) {
        return pokemon.id;
    }
    const url = pokemon.url;
    if (!url) return null;
    const match =
        url.match(/\/pokemon\/(\d+)\/?$/) ??
        url.match(/\/pokemon-species\/(\d+)\/?$/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const PokemonCard: React.FC<PokemonCardProps> = ({pokemonOverview, isActive = false, isList = false}) => {
    const hasCompleteInitialData = typeof pokemonOverview.base_experience === "number" && Array.isArray(pokemonOverview.types) && pokemonOverview.types.length > 0;
    const [details, setDetails] = useState<PokemonCardDetails>({
        baseExperience: pokemonOverview.base_experience ?? null,
        types: pokemonOverview.types,
    });
    const [isHydrating, setIsHydrating] = useState(!hasCompleteInitialData);

    useEffect(() => {
        const cacheKey = pokemonOverview.name.toLowerCase();
        const cachedDetails = pokemonCardCache.get(cacheKey);
        if (cachedDetails) {
            setDetails(cachedDetails);
            setIsHydrating(false);
            return;
        }

        if (hasCompleteInitialData) {
            const nextDetails = {
                baseExperience: pokemonOverview.base_experience ?? null,
                types: pokemonOverview.types,
            };
            pokemonCardCache.set(cacheKey, nextDetails);
            setDetails(nextDetails);
            setIsHydrating(false);
            return;
        }

        let isCancelled = false;
        setIsHydrating(true);

        const hydratePokemonCard = async () => {
            const response = await PokemonApiClient.getPokemonByName(pokemonOverview.name);
            if (isCancelled || !response.success || !response.data) {
                if (!isCancelled) {
                    setIsHydrating(false);
                }
                return;
            }

            const nextDetails = {
                baseExperience: response.data.base_experience,
                types: response.data.types,
            };
            pokemonCardCache.set(cacheKey, nextDetails);
            setDetails(nextDetails);
            if (!isCancelled) {
                setIsHydrating(false);
            }
        };

        hydratePokemonCard();

        return () => {
            isCancelled = true;
        };
    }, [pokemonOverview.name, pokemonOverview.base_experience, pokemonOverview.types, hasCompleteInitialData]);

    const displayTypes = details.types ?? pokemonOverview.types;
    const primaryType = displayTypes?.[0]?.type?.name || "normal";
    const gradientClass = typeGradients[primaryType] || typeGradients.normal;
    const pokemonId = extractPokemonId(pokemonOverview);
    const imgURL = pokemonId
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
        : "/sprites/question-mark.png";
    const displayExp = details.baseExperience ?? pokemonOverview.base_experience ?? "-";

    return (
        <Link
            href={`/pokemon/${pokemonOverview.name}`}
            className={`${isActive ? ("border-2 border-gray-300 ") : ("border-gray-700 ")} 
            relative flex flex-col items-center justify-center text-center 
        w-full h-full p-6  rounded-tr-3xl rounded-bl-3xl shadow 
       hover:bg-gray-600 -hidden transition-transform duration-300 ease-in-out hover:scale-105 background-muted`}
        >
            {/* Left Half Gradient Background with Dim Overlay */}
            <div
                className={`absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l ${gradientClass} opacity-75 rounded-tr-3xl rounded-bl-3xl pt-2 text-gray-200 z-0`}
            >
                <span className="!text-white z-10">{isHydrating ? "Loading EXP..." : `EXP: ${displayExp}`}</span>
            </div>

            {/* Semi-Transparent Dark Overlay to Further Dim */}
            <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

            <div className={`${isList ? ("flex-row gap-20") : ("flex-col")} flex  items-center justify-center h-full relative z-10`}>

                <Image
                    src={imgURL}
                    alt={pokemonOverview.name || "Pokemon Image"}
                    width={160}
                    height={160}
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 160px"
                    className="w-40 h-40 object-contain mx-auto"
                />
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-100 font-[family-name:var(--font-geist-mono)]">
                        {pokemonOverview.name.toUpperCase()}
                    </h5>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 flex-wrap justify-center">
                            {displayTypes?.map((type, typeIndex) => (
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
            </div>

            {isHydrating && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-tr-3xl rounded-bl-3xl bg-slate-950/35 backdrop-blur-[1px]">
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white/90">
                        <div className="h-40 w-40 rounded-full bg-white/10 animate-pulse" />
                        <div className="flex w-full flex-col items-center gap-3">
                            <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
                            <div className="flex gap-2">
                                <div className="h-6 w-14 rounded-md bg-white/10 animate-pulse" />
                                <div className="h-6 w-14 rounded-md bg-white/10 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Link>
    );
};

export default PokemonCard;
