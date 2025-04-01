export interface Species {
    name: string;
    url: string;
  }
  
  export interface EvolutionNode {
    species: Species;
    evolves_to: EvolutionNode[];
  }
  
  export interface EvolutionChain {
    chain: EvolutionNode;
  }
  