export interface NamedAPIResource {
    name: string;
    url: string;
  }
  
  export interface Ability {
    ability: NamedAPIResource;
    is_hidden: boolean;
    slot: number;
  }
  
  export interface GameIndex {
    game_index: number;
    version: NamedAPIResource;
  }
  
  export interface HeldItem {
    item: NamedAPIResource;
    version_details: {
      rarity: number;
      version: NamedAPIResource;
    }[];
  }
  
  export interface Move {
    move: NamedAPIResource;
    version_group_details: {
      level_learned_at: number;
      move_learn_method: NamedAPIResource;
      version_group: NamedAPIResource;
    }[];
  }
  
  export interface Stat {
    base_stat: number;
    effort: number;
    stat: NamedAPIResource;
  }
  
  export interface Type {
    slot: number;
    type: NamedAPIResource;
  }
  
  export interface Cries {
    latest: string;
    legacy: string;
  }
  
	  export interface Sprites {
    back_default: string | null;
    back_female: string | null;
    back_shiny: string | null;
    back_shiny_female: string | null;
    front_default: string | null;
    front_female: string | null;
    front_shiny: string | null;
    front_shiny_female: string | null;
	    other?: Record<string, unknown>;
	    versions?: Record<string, unknown>;
	  }

  export interface PokemonComplete {
    id: number;
    name: string;
    base_experience: number;
    height: number;
    weight: number;
    is_default: boolean;
    order: number;
    location_area_encounters: string;
  
    abilities: Ability[];
    cries: Cries;
    forms: NamedAPIResource[];
    game_indices: GameIndex[];
    held_items: HeldItem[];
    moves: Move[];
    species: NamedAPIResource;
    sprites: Sprites;
    stats: Stat[];
    types: Type[];
  
	    past_abilities: unknown[];
	    past_types: unknown[];
}

export type ChatType = "pokemon" | "assistant";
