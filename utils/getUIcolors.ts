import { PokemonDetails } from "@/types/interfaces";
import { uiThemePokemon } from "@/types/uiThemePokemonType";
import { typeGradients, typeColors, typeAverageColor } from "@/utils/typeColors";

const getGradientColor = (pokemon: PokemonDetails): string => {
  const primaryType = pokemon?.types?.[0]?.type?.name || "normal";
  const gradientClass = typeGradients[primaryType] || typeGradients["normal"];
  return gradientClass;
};
export default getGradientColor;

export const getColorTheme = (pokemon: PokemonDetails): uiThemePokemon => {
  const primaryType = pokemon?.types?.[0]?.type?.name || "normal";
  return {
    backgroundColor: typeColors[primaryType],
    themeColor: typeColors[primaryType + "TW"],
    textColor: typeColors[primaryType + "COLOR"],
  };
};

export const getAverageColor = (pokemon: PokemonDetails): string => {
  const primaryType = pokemon?.types?.[0]?.type?.name || "normal";
  const averageColor = typeAverageColor[primaryType] || typeAverageColor["normal"];
  return averageColor;
};
