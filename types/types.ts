
export interface Pokemon {
    name: string;
    url: string;
  }

export interface Response {
    count: string;
    next: string;
    previous : string | null ;
    results : Pokemon[];
}
export interface PokemonType {
    type: {
      name: string;
    };
  }
  
  export interface PokemonSprites {
    front_default: string;
    front_shiny: string;
    other: {
      'official-artwork': {
        front_default: string;
        front_shiny: string;
      };
    };
  }
  
  export interface PokemonDetails {
    name: string;
    height: number;
    weight: number;
    base_experience: number;
    types: PokemonType[];
    sprites: PokemonSprites;
  }