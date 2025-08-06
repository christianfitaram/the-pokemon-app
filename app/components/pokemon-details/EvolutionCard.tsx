import { EvolutionNode } from "@/types/evolutionTypes";
import { useState, useEffect } from "react";
import PokemonCard from "../PokemonCard";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

interface EvolutionCardProps {
  name: string;
}
export const EvolutionCard: React.FC<EvolutionCardProps> = ({ name }) => {
  const [evolutionChainContent, setEvolutionChainContent] =
    useState<EvolutionNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getEvolutionChainContent() {
      const result = await PokemonApiClient.getPokemonEvolutionChain(name);
      if (result.success && result.data) {
        setEvolutionChainContent(result.data);
      } else {
        setError(result.error || "Unknown error");
        console.log(error)
      }
    }
    getEvolutionChainContent();
  }, [name]);

  const getAllSpecies = (node: EvolutionNode): string[] => {
    let speciesList = [node.species.name];

    node.evolves_to.forEach((child) => {
      speciesList = speciesList.concat(getAllSpecies(child));
    });

    return speciesList;
  };

  return (
    <div className="flex gap-4 justify-center items-center w-full">
      {evolutionChainContent?.evolves_to && (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-center w-full">
          <div>
            <h5
              className={`mb-2 text-2xl font-bold tracking-tight  text-white flex flex-row justify-center`}
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
