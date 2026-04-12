import {capitalizeFirstLetter} from "@/utils/capitalizeFirstLetter";
import {useEffect, useState} from "react";
import {Pokemon, PokemonCardProps} from "@/types/interfaces";
import Link from "next/link";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";
import formatDateTime from "../utils/formatDateTime";
import Image from "next/image";
import { typeGradients } from "@/utils/typeColors";


const PokemonCard: React.FC<PokemonCardProps> = ({pokemonOverview, isActive = false, isList = false}) => {
    const [pokemonData, setPokemonData] = useState<Pokemon>(pokemonOverview);

    useEffect(() => {
        let isMounted = true;

        async function fetchPokemon() {
            if (
                pokemonOverview.id &&
                pokemonOverview.types &&
                typeof pokemonOverview.base_experience === "number"
            ) {
                setPokemonData(pokemonOverview);
                return;
            }

            const result = await PokemonApiClient.getPokemonByName(
                pokemonOverview.name
            );
            if (isMounted && result.success && result.data) {
                setPokemonData({
                    ...pokemonOverview,
                    id: result.data.id,
                    types: result.data.types,
                    base_experience: result.data.base_experience,
                });
            }
        }

        fetchPokemon();
        return () => {
            isMounted = false;
        };
    }, [pokemonOverview]);

    const primaryType = pokemonData.types?.[0]?.type?.name || "normal";
    const gradientClass = typeGradients[primaryType] || typeGradients.normal;
    const imgURL = pokemonData.id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.id}.png`
        : "/sprites/question-mark.png";

    return (
        <Link
            href={`/pokemon/${pokemonData.name}`}
            className={`${isActive ? ("border-2 border-gray-300 ") : ("border-gray-700 ")} 
            relative flex flex-col items-center justify-center text-center 
        w-full h-full p-6  rounded-tr-3xl rounded-bl-3xl shadow 
       hover:bg-gray-600 -hidden transition-transform duration-300 ease-in-out hover:scale-105 background-muted`}
        >
            {/* Left Half Gradient Background with Dim Overlay */}
            <div
                className={`absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l ${gradientClass} opacity-75 rounded-tr-3xl rounded-bl-3xl pt-2 text-gray-200 z-0`}
            >
                <span className="!text-white z-10">EXP: {pokemonData.base_experience ?? "-"}</span>
            </div>

            {/* Semi-Transparent Dark Overlay to Further Dim */}
            <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

            <div className={`${isList ? ("flex-row gap-20") : ("flex-col")} flex  items-center justify-center h-full relative z-10`}>

                <Image
                    src={imgURL}
                    priority
                    alt={pokemonData.name || "Pokemon Image"}
                    width={160}
                    height={160}
                    className="w-40 h-40 object-contain mx-auto"
                />
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-100 font-[family-name:var(--font-geist-mono)]">
                        {pokemonData.name.toUpperCase()}
                    </h5>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 flex-wrap justify-center">
                            {pokemonData.types?.map((type, typeIndex) => (
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
        </Link>
    );
};

export default PokemonCard;
