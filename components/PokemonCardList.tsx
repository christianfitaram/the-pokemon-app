import {capitalizeFirstLetter} from "@/utils/capitalizeFirstLetter";
import {useEffect, useState} from "react";
import {PokemonCardProps, PokemonDetails} from "@/types/interfaces";
import Link from "next/link";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";
import formatDateTime from "../utils/formatDateTime";
import getGradientColor from "../utils/getUIcolors";
import Image from "next/image";
import {getURLimg} from "@/utils/getURLimg";


const PokemonCard: React.FC<PokemonCardProps> = ({pokemonOverview, isActive = false}) => {
    const [randomPokemons, setRandomPokemons] = useState<PokemonDetails | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const [gradientClass, setGradientClass] = useState<string | null>(null);
    const [imgURL, setImgURL] = useState<string>("/sprites/question-mark.png");
    //Lets fetch the pokemon data to display in card

    useEffect(() => {
        async function fetchPokemon() {
            const result = await PokemonApiClient.getPokemonByName(
                pokemonOverview.name
            );
            if (result.success && result.data) {
                setRandomPokemons(result.data);
            } else {
                setError(result.error || "Unknown error");
                console.log(error);
            }
        }

        fetchPokemon();
    }, [pokemonOverview.name]);
    //Lets assign the gradient for the top bar
    useEffect(() => {
        if (randomPokemons) {
            setGradientClass(getGradientColor(randomPokemons));
            setImgURL(getURLimg(randomPokemons))
        }
    }, [randomPokemons]);

    return (
        <Link
            href={`/pokemon/${randomPokemons?.name}`}
            className={`${isActive ? ("border-2 border-gray-300 ") : ("border-gray-700 ")} relative flex flex-col items-center justify-center text-center 
        w-full h-full p-6  rounded-tr-3xl rounded-bl-3xl shadow 
       hover:bg-gray-600 -hidden transition-transform duration-300 ease-in-out hover:scale-105 background-muted`}
        >
            {/* Left Half Gradient Background with Dim Overlay */}
            <div
                className={`absolute left-0 top-0 w-full h-1/4 bg-gradient-to-l ${gradientClass} opacity-75 rounded-tr-3xl rounded-bl-3xl pt-2 text-gray-200 z-0`}
            >
                <span className="!text-white z-10">EXP: {randomPokemons?.base_experience}</span>
            </div>

            {/* Semi-Transparent Dark Overlay to Further Dim */}
            <div className="absolute left-0 top-0 w-full h-full bg-black opacity-5 rounded-l-lg"></div>

            <div className="flex flex-col items-center justify-center h-full relative z-10">

                <Image
                    src={imgURL}
                    priority
                    alt={randomPokemons?.name || "Pokemon Image"}
                    width={160}
                    height={160}
                    className="w-40 h-40 object-contain mx-auto"
                />

                <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-100 font-[family-name:var(--font-geist-mono)]">
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
