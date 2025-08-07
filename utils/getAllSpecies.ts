import {EvolutionNode} from "@/types/evolutionTypes";

export const getAllSpecies = (node: EvolutionNode): string[] => {
    let speciesList = [node.species.name];

    node.evolves_to.forEach((child) => {
        speciesList = speciesList.concat(getAllSpecies(child));
    });

    return speciesList;
};

export default getAllSpecies;
