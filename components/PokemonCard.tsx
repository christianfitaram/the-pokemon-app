"use client";

import {capitalizeFirstLetter} from "@/utils/capitalizeFirstLetter";
import {Pokemon, PokemonCardProps} from "@/types/interfaces";
import Link from "next/link";
import formatDateTime from "../utils/formatDateTime";
import Image from "next/image";
import { typeGradients } from "@/utils/typeColors";

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
    const displayTypes = pokemonOverview.types ?? [];
    const primaryType = displayTypes?.[0]?.type?.name || "normal";
    const gradientClass = typeGradients[primaryType] || typeGradients.normal;
    const pokemonId = extractPokemonId(pokemonOverview);
    const imgURL = pokemonId
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
        : "/sprites/question-mark.png";
    const displayExp = pokemonOverview.base_experience ?? "-";

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
                <span className="!text-white z-10">EXP: {displayExp}</span>
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
                            {displayTypes.length > 0 ? (
                                displayTypes.map((type, typeIndex) => (
                                    <span
                                        key={typeIndex}
                                        className="bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded-md"
                                    >
                                        {capitalizeFirstLetter(type.type.name)}
                                    </span>
                                ))
                            ) : (
                                <span className="bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded-md">
                                    Type unknown
                                </span>
                            )}
                        </div>
                        {pokemonOverview.viewedAt && (
                            <div className="bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-md">
                                Viewed {formatDateTime(pokemonOverview.viewedAt)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PokemonCard;
