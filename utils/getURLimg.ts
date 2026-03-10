import {PokemonDetails} from "@/types/interfaces";

const NO_IMG = [10264,10267,10265,10145,10270,10271,10268,10266,10269]
const OFFICIAL_ARTWORK_BASE_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/";

export function getURLimg(pokemon:PokemonDetails) {
    const id: number = pokemon.id
    if (NO_IMG.includes(id)) return "/sprites/question-mark.png"
    return OFFICIAL_ARTWORK_BASE_URL + id + ".png"
}
