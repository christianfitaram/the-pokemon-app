"use client";
import { useEffect, useState } from "react";
import { searchEngine } from "../utils/searchEngine";
import { Pokemon, ToDisplayProps } from "@/types/types";
import { capitalizeFirstLetter } from "../utils/functions";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fetchRandomPokemon } from "../utils/fetchspecials";
import { useRouter } from "next/navigation";
import { useRecentlyViewed } from "../utils/useRecentlyViewed";
import { FaHome } from "react-icons/fa";

const Search: React.FC<ToDisplayProps> = ({
  value,
  onChange,
  setisSearchOn,
  setIsUserChatting,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeFilteredPokemons, setTypeFilteredPokemons] = useState<Pokemon[]>(
    []
  );
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [allPokemonNames, setAllPokemonNames] = useState<Pokemon[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const router = useRouter();

  const getRandomPokemon = async () => {
    let name = await fetchRandomPokemon();
    while (name === null) {
      name = await fetchRandomPokemon();
    }
    router.push(`/details/${name}`);
  };

  const { recent } = useRecentlyViewed();

  // Fetch all Pokémon names once for name search
  useEffect(() => {
    const fetchAll = async () => {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1302");
      const data = await res.json();
      setAllPokemonNames(data.results);
    };
    fetchAll();
  }, []);

  const handleTypeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = event.target.value;
    if (selectedType && !selectedTypes.includes(selectedType)) {
      setSelectedTypes([...selectedTypes, selectedType]);
      setSelectedType("");
    }
  };

  const removeType = (type: string) => {
    const updated = selectedTypes.filter((t) => t !== type);
    setSelectedTypes(updated);
    setSelectedType(undefined);
    setTypeFilteredPokemons([]);

    if (updated.length === 0) {
      if (!searchQuery) {
        setisSearchOn(false);
        onChange([]); // reset to default
      } else {
        setisSearchOn(true);
        onChange(value); // restore grid for name search
      }
    }
  };

  const toListRecentlyViewed = () => {
    const pokemonRecent: Pokemon[] = [];
    recent.forEach((poke) => {
      const pokemonTemp: Pokemon = {
        name: poke.name,
        url: poke.url,
        viewedAt: poke.viewedAt,
      };
      pokemonRecent.push(pokemonTemp);
    });
    onChange(pokemonRecent);
    setisSearchOn(true);
  };

  const showAssistantChat = () => {
    setIsUserChatting(true);
  };
  // Fetch Pokémon by selected type(s)
  useEffect(() => {
    async function fetchPokemonsByType() {
      if (selectedTypes.length === 0) {
        setisSearchOn(false);
        setTypeFilteredPokemons([]);
        return;
      }

      setisSearchOn(true);
      const results = await searchEngine(selectedTypes);
      setTypeFilteredPokemons(results);
    }

    fetchPokemonsByType();
  }, [selectedTypes]);

  useEffect(() => {
    const el = document.getElementById(`dropdown-item-${highlightedIndex}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedIndex]);
  useEffect(() => {
    const nameFiltered =
      selectedTypes.length > 0
        ? searchQuery
          ? typeFilteredPokemons.filter((pokemon) =>
              pokemon.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : typeFilteredPokemons
        : searchQuery
        ? value.filter((pokemon) =>
            pokemon.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : value;

    onChange(nameFiltered);
    setisSearchOn(selectedTypes.length > 0);
  }, [searchQuery, selectedTypes, typeFilteredPokemons]);

  const filteredDropdown = allPokemonNames.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const goToHome = () => {
    setisSearchOn(false);
    onChange([]); // reset to default
  };
  const handleDropdownSelect = (pokemon: Pokemon) => {
    onChange([pokemon]);
    setisSearchOn(true);
    setShowDropdown(false);
    setSearchQuery(pokemon.name);
  };
  return (
    <div className=" background-muted bg-gray-400 flex flex-col items-center w-full my-4 py-4 relative">
      {/* Search by Name */}
      <input
        type="text"
        placeholder="Search Pokémon by name..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowDropdown(
            e.target.value.length > 0 && selectedTypes.length === 0
          );
          setHighlightedIndex(0);
        }}
        onKeyDown={(e) => {
          if (!showDropdown || filteredDropdown.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev === filteredDropdown.length - 1 ? 0 : prev + 1
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev === 0 ? filteredDropdown.length - 1 : prev - 1
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            handleDropdownSelect(filteredDropdown[highlightedIndex]);
          }
        }}
        className="w-full search pl-12 max-w-sm px-4 py-2 rounded-3xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-gray-800"
      />

      {/* Dropdown menu for name matches */}
      <AnimatePresence>
        {showDropdown && filteredDropdown.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[92px] max-w-sm w-full bg-white rounded-md shadow-md z-10 border max-h-64 overflow-y-auto overscroll-contain"
          >
            {filteredDropdown.slice(0, 15).map((pokemon, index) => (
              <Link
                key={pokemon.name}
                href={`/details/${capitalizeFirstLetter(pokemon.name)}`}
              >
                <li
                  id={`dropdown-item-${index}`}
                  onClick={() => handleDropdownSelect(pokemon)}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800 ${
                    highlightedIndex === index ? "bg-blue-100" : ""
                  }`}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: pokemon.name.replace(
                        new RegExp(searchQuery, "i"),
                        (match) =>
                          `<span class="font-bold text-blue-600">${match}</span>`
                      ),
                    }}
                  />
                </li>
              </Link>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Type Filter */}
      <SelectMenu
        handleTypeSelect={handleTypeSelect}
        selectedType={selectedType}
      />

      {/* Selected Types */}
      <div className="flex flex-wrap my-8 gap-2">
        {selectedTypes.map((type) => (
          <span
            key={type}
            className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center"
          >
            {type}
            <button
              onClick={() => removeType(type)}
              className="ml-2 text-white"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-4 mt-4">
        <button
          onClick={goToHome}
          className="border flex flex-row items-center justify-center gap-2 p-2 text-white rounded-lg hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
        >
          <FaHome className="h-5 w-5" /> Go Home
        </button>
        <button
          className="border p-2 rounded-lg text-white hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={getRandomPokemon}
        >
          Random Pokémon
        </button>
        <button
          className="border p-2 rounded-lg text-white hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={toListRecentlyViewed}
        >
          Recently Viewed
        </button>
        <button
          onClick={showAssistantChat}
          className="border p-2 text-white rounded-lg hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
        >
          Get AI Help
        </button>
      </div>
    </div>
  );
};

export default Search;

interface SelectMenuProps {
  handleTypeSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedType: string | undefined;
}
const SelectMenu: React.FC<SelectMenuProps> = ({
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
    <div className="flex flex-row items-center gap-4 mt-4">
      <p className="font-[family-name:var(--font-geist-mono)] text-white flex flex-col">
        Search by type:
      </p>
      <select
        onChange={handleTypeSelect}
        className="px-4 py-2 bg-gray-700 text-white rounded-md flex flex-col"
        defaultValue=""
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
