import {PokemonDetails} from "@/types/interfaces";

const NO_IMG = [10264,10267,10265,10145,10270,10271,10268,10266,10269]

export function getURLimg(pokemon:PokemonDetails) {
    const baseURL: string =  "/sprites/official-artwork/"
    const id: number = pokemon.id
    if (NO_IMG.includes(id)) return "/sprites/question-mark.png"
    return baseURL + id + ".png"
}
