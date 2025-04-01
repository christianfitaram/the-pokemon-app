import { EvolutionNode } from "@/types/evolutionTypes";
import { useState, useEffect } from "react";
import PokemonCard from "./PokemonCard";

interface EvolutionCardProps {
  name: string;
}
export const EvolutionCard: React.FC<EvolutionCardProps> = ({ name }) => {
  const [evolutionChain, setEvolutionChain] = useState<string | null>(null);
  const [evolutionChainContent, setEvolutionChainContent] =
    useState<EvolutionNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;

    const getEvolutionChain = async () => {
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${name}`
        );
        const data = await res.json();
        setEvolutionChain(data.evolution_chain.url);
      } catch (error) {
        setError((error as Error).message);
      }
    };
    getEvolutionChain();
  }, [name]);

  useEffect(() => {
    const getEvolutionChainContent = async () => {
      try {
        const res2 = await fetch(evolutionChain || "");
        const data2 = await res2.json();
        setEvolutionChainContent(data2.chain);
      } catch (error) {
        setError((error as Error).message);
      }
    };
    getEvolutionChainContent();
  }, [evolutionChain]);

  const getAllSpecies = (node: EvolutionNode): string[] => {
    let speciesList = [node.species.name];

    node.evolves_to.forEach((child) => {
      speciesList = speciesList.concat(getAllSpecies(child));
    });

    return speciesList;
  };

  return (
    <div className="flex gap-4 justify-center">
      {evolutionChainContent && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <h5
              className={`mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex flex-row justify-center`}
            >
              Evolution chain:
            </h5>
          </div>
          {getAllSpecies(evolutionChainContent).map((name, index) => {
            const pokemon = {
              name: name,
              url: `https://pokeapi.co/api/v2/pokemon/${name}`,
            };
            return <PokemonCard pokemonOverview={pokemon} key={index} />;
          })}
        </div>
      )}
    </div>
  );
};
