import {EvolutionNode} from "@/types/evolutionTypes";
import {useEffect, useMemo, useState} from "react";
import PokemonCard from "../PokemonCard";
import {PokemonApiClient} from "@/lib/api_clients/pokemonApiClient";
import {PokemonCardWrapper, Title} from "@/components/layout/GeneralLayout";
import {EvolutionSkeleton} from "@/components/layout/Skeletons";
import getAllSpecies from "@/utils/getAllSpecies";
import { EnrichedEvolutionNode } from "@/types/enrichedPokemon";

function buildEvolutionChainFromEnrichedNodes(
    nodes: EnrichedEvolutionNode[] | undefined
): EvolutionNode | null {
    if (!nodes?.length) return null;

    const byName = new Map(nodes.map((node) => [node.speciesName, node]));
    const rootName = nodes[0].speciesName;
    const visiting = new Set<string>();

    const buildNode = (name: string): EvolutionNode => {
        const source = byName.get(name);
        const speciesUrl = source?.speciesUrl || "";

        if (visiting.has(name)) {
            return {
                species: { name, url: speciesUrl },
                evolves_to: [],
            };
        }

        visiting.add(name);
        const evolvesTo = (source?.evolvesTo || []).map((nextName) => buildNode(nextName));
        visiting.delete(name);

        return {
            species: { name, url: speciesUrl },
            evolves_to: evolvesTo,
        };
    };

    return buildNode(rootName);
}

export const EvolutionCard = ({
    name,
    enrichedNodes,
}: {
    name: string;
    enrichedNodes?: EnrichedEvolutionNode[];
}) => {
    const prefetchedEvolutionChain = useMemo(
        () => buildEvolutionChainFromEnrichedNodes(enrichedNodes),
        [enrichedNodes]
    );
    const [evolutionChainContent, setEvolutionChainContent] =
        useState<EvolutionNode | null>(prefetchedEvolutionChain);
    const [error, setError] = useState<string | null>(null);
    const [originalPokemon, setOriginalPokemon] = useState<string | null>(null);
    const [numOfEvolutions, setNumOfEvolutions] = useState<number | null>(null);

    useEffect(() => {
        if (!prefetchedEvolutionChain) return;
        setOriginalPokemon(name);
        setError(null);
        setEvolutionChainContent(prefetchedEvolutionChain);
    }, [name, prefetchedEvolutionChain]);

    useEffect(() => {
        if (prefetchedEvolutionChain) return;
        let isCancelled = false;

        async function getEvolutionChainContent() {
            setOriginalPokemon(name);
            const result = await PokemonApiClient.getPokemonEvolutionChain(name);
            if (isCancelled) return;
            if (result.success && result.data) {
                setEvolutionChainContent(result.data);
                setError(null);
            } else {
                setError(result.error || "Unknown error");
            }
        }

        getEvolutionChainContent();
        return () => {
            isCancelled = true;
        };
    }, [name, prefetchedEvolutionChain]);

    useEffect(() => {
        if (evolutionChainContent != null) {
            setNumOfEvolutions(getAllSpecies(evolutionChainContent).length)
        }
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
                {getAllSpecies(evolutionChainContent).map((species, index) => {
                    const pokemon = {
                        name: species.name,
                        url: species.url,
                    };
                    return originalPokemon == species.name ? (
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
