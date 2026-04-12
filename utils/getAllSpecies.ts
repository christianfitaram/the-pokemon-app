import {EvolutionNode, Species} from "@/types/evolutionTypes";

export const getAllSpecies = (node: EvolutionNode): Species[] => {
    let speciesList: Species[] = [node.species];

    node.evolves_to.forEach((child) => {
        speciesList = speciesList.concat(getAllSpecies(child));
    });

    return speciesList;
};

export default getAllSpecies;
