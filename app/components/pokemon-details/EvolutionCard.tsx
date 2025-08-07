import {EvolutionNode} from "@/types/evolutionTypes";
import {useState, useEffect} from "react";
import PokemonCard from "../PokemonCard";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";
import {PokemonCardWrapper, Title} from "@/app/components/layout/GeneralLayout";
import {EvolutionSkeleton} from "@/app/components/layout/Skeletons";
import getAllSpecies from "@/utils/getAllSpecies";

export const EvolutionCard = ({name}: { name: string}  ) => {
    const [evolutionChainContent, setEvolutionChainContent] =
        useState<EvolutionNode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [originalPokemon, setOriginalPokemon] = useState<string | null>(null);
    const [numOfEvolutions, setNumOfEvolutions] = useState<number | null>(null);

    useEffect(() => {
        async function getEvolutionChainContent() {
            setOriginalPokemon(name);
            const result = await PokemonApiClient.getPokemonEvolutionChain(name);
            if (result.success && result.data) {
                setEvolutionChainContent(result.data);
            } else {
                setError(result.error || "Unknown error");
                console.log(error);
            }
        }

        getEvolutionChainContent();
    }, [name]);

    useEffect(() => {
        async function NumOfEvolutions() {
            if (evolutionChainContent != null) {
                setNumOfEvolutions(getAllSpecies(evolutionChainContent).length)
                console.log(numOfEvolutions)
            }
        }

        NumOfEvolutions();
    }, [evolutionChainContent]);

    if (error) {
        return null;
    }

    return (
        evolutionChainContent?.evolves_to ? (
            <div
                className={`${(numOfEvolutions != null && numOfEvolutions > 4) ? ('2xl:flex-row items-center') : ('lg:flex-row')} flex flex-col  gap-4`}>
                <Title>
                    {(numOfEvolutions != null && numOfEvolutions > 3) ? ('Possible Evolutions: ') : ('Evolution chain:')}
                </Title>
                {getAllSpecies(evolutionChainContent).map((name, index) => {
                    const pokemon = {
                        name: name,
                        url: `https://pokeapi.co/api/v2/pokemon/${name}`,
                    };
                    return originalPokemon == name ? (
                        <PokemonCardWrapper numOfEvolutions={numOfEvolutions} key={index}>
                            <PokemonCard
                                pokemonOverview={pokemon}
                                isActive={true}
                            />
                        </PokemonCardWrapper>
                    ) : (
                        <PokemonCardWrapper numOfEvolutions={numOfEvolutions} key={index}>
                            <PokemonCard pokemonOverview={pokemon}/>
                        </PokemonCardWrapper>
                    );
                })}
            </div>
        ) : <EvolutionSkeleton/>
    );
};
