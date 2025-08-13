import { PokemonDetails } from "@/types/interfaces";
import UnifiedChat from "./UnifiedChat";

export default function PokemonChat({
  pokemon,
  onClick,
}: {
  pokemon: PokemonDetails;
  onClick: () => void;
}) {
  return (
    <UnifiedChat
      chatType="pokemon"
      pokemon={pokemon}
      onClose={onClick}
      onBack={onClick}
      showBackButton={true}
      showAnimation={true}
    />
  );
}
