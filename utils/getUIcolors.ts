import { PokemonDetails } from "@/types/interfaces";
import { uiThemePokemon } from "@/types/uiThemePokemonType";
import { typeGradients, typeColors, typeAverageColor } from "@/utils/typeColors";

const getGradientColor = (randomPokemons: PokemonDetails): string => {
  const primaryType = randomPokemons?.types?.[0]?.type?.name || "normal";
  const gradientClass = typeGradients[primaryType] || typeGradients["normal"];
  return gradientClass;
};
export default getGradientColor;

export const getColorTheme = (
  randomPokemons: PokemonDetails
): uiThemePokemon => {
  const primaryType = randomPokemons?.types?.[0]?.type?.name || "normal";
  return {
    backgroundColor: typeColors[primaryType],
    themeColor: typeColors[primaryType + "TW"],
    textColor: typeColors[primaryType + "COLOR"],
  };
};

export const getAvergareColor = (randomPokemons: PokemonDetails): string => {
  const primaryType = randomPokemons?.types?.[0]?.type?.name || "normal";
  const averageColor = typeAverageColor[primaryType] || typeAverageColor["normal"];
  return averageColor;
};
