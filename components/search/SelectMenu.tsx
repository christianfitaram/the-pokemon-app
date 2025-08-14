import { SelectMenuProps } from "@/types/interfaces";

export const SelectMenu: React.FC<SelectMenuProps> = ({
    handleTypeSelect,
    selectedType,
}) => {
    const pokemonTypes = [
        "Normal",
        "Fire",
        "Water",
        "Grass",
        "Electric",
        "Ice",
        "Fighting",
        "Poison",
        "Ground",
        "Flying",
        "Psychic",
        "Bug",
        "Rock",
        "Ghost",
        "Dragon",
        "Dark",
        "Steel",
        "Fairy",
    ];

    return (
        <div className="flex flex-row items-center gap-4">
            <p className="font-[family-name:var(--font-geist-mono)] text-white flex flex-col">
                Search by type:
            </p>
            <select
                onChange={handleTypeSelect}
                name="type"
                className="px-4 py-2 bg-gray-700 text-white rounded-md flex flex-col"
                value={selectedType}
            >
                <option value="" disabled>
                    Select Pokémon Type
                </option>
                {pokemonTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                        {type}
                    </option>
                ))}
            </select>
        </div>
    );
};
