export interface EnrichedPokemonMove {
    name: string;
    url: string;
    learnMethod: string;
    levelLearnedAt: number;
}

export interface EnrichedPokemonStat {
    name: string;
    base: number;
    effort: number;
}

export interface EnrichedPokemonAbility {
    name: string;
    isHidden: boolean;
    slot: number;
    effect: string;
    shortEffect: string;
}

export interface EnrichedPokemonSpecies {
    genus: string;
    flavorText: string;
    habitat: string | null;
    shape: string | null;
    color: string;
    captureRate: number;
    baseHappiness: number;
    growthRate: string;
    eggGroups: string[];
    genderRate: number;
    isLegendary: boolean;
    isMythical: boolean;
}

export interface EnrichedEvolutionNode {
    speciesName: string;
    speciesUrl: string;
    evolvesTo: string[];
    minLevel: number | null;
    trigger: string | null;
    item: string | null;
    timeOfDay: string | null;
    needsTrade: boolean;
    heldItem: string | null;
}

export interface EnrichedPokemonEncounter {
    location: string;
    versions: string[];
}

export interface EnrichedPokemonData {
    id: number;
    name: string;
    height: number;
    weight: number;
    baseExperience: number;
    types: string[];
    sprites: {
        frontDefault: string | null;
        artworkDefault: string | null;
    };
    stats: EnrichedPokemonStat[];
    moves: EnrichedPokemonMove[];
    abilities: EnrichedPokemonAbility[];
    species: EnrichedPokemonSpecies;
    evolution: {
        chainId: number | null;
        nodes: EnrichedEvolutionNode[];
    };
    encounters?: EnrichedPokemonEncounter[];
}
