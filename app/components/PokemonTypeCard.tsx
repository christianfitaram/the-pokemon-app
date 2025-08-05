import { PokemonDetails, PokemonType } from "@/types/types";
import { typeColors } from "../../utils/typeColors";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";

type PokemonTypeCardProps = {
  type: PokemonType;
};

type PokemonTypeListProps = {
  pokemon: PokemonDetails;
};

export function PokemonTypeCard({ type }: PokemonTypeCardProps) {
  const typeName = type.type.name;
  return (
    <div
      key={typeName}
      className={`flex flex-col w-20 text-white p-2 rounded-3xl items-center gap-4 bg-gray-700`}
    >
      <div
        className="gradient-badge p-2 rounded-full"
        style={
          {
            "--gradient-color": typeColors[typeName],
          } as React.CSSProperties
        }
      >
        <img
          src={`/assets/img/icons/${typeName}.svg`}
          alt={`${typeName} icon`}
          className="w-5 h-5 "
        />
      </div>
      <div>
        <p>{capitalizeFirstLetter(typeName)}</p>
      </div>
    </div>
  );
}

export function PokemonTypeList({ pokemon }: PokemonTypeListProps) {
  return (
    <>
      <div className="flex flex-row text-gray-200">
        <div>
          <p>TYPES:</p>
        </div>
        <hr />
      </div>
      <div className="flex flex-row gap-2 my-2">
        {pokemon?.types.map((type, index) => (
          <PokemonTypeCard key={index} type={type} />
        ))}
      </div>
    </>
  );
}
