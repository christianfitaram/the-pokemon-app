
import {Pokemon, SearchInputProps} from "@/types/interfaces";
import {AnimatePresence, motion} from "framer-motion";
import Link from "next/link";
import {capitalizeFirstLetter} from "@/utils/capitalizeFirstLetter";

export const SearchInput: React.FC<SearchInputProps> = ({
                                                            searchQuery,
                                                            setSearchQuery,
                                                            showDropdown,
                                                            setShowDropdown,
                                                            highlightedIndex,
                                                            setHighlightedIndex,
                                                            noMatchesMessage,
                                                            setNoMatchesMessage,
                                                            filteredDropdown,
                                                            handleDropdownSelect,
                                                        }) => {
    return (
        <div className="relative w-full max-w-sm">
            <input
                type="text"
                name="search"
                placeholder="Search Pokémon by name..."
                autoComplete="off"
                data-testid="search-input"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                    setHighlightedIndex(0);
                    setNoMatchesMessage(null);
                }}
                onKeyDown={(e) => handleKeyDown(e, {
                    showDropdown,
                    filteredDropdown,
                    highlightedIndex,
                    setHighlightedIndex,
                    setShowDropdown,
                    setNoMatchesMessage,
                    handleDropdownSelect
                })}
                className="w-full search pl-12 max-w-sm px-4 py-2 rounded-3xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            <SearchDropdown
                showDropdown={showDropdown}
                noMatchesMessage={noMatchesMessage}
                filteredDropdown={filteredDropdown}
                searchQuery={searchQuery}
                highlightedIndex={highlightedIndex}
                handleDropdownSelect={handleDropdownSelect}
            />
        </div>
    );
};

const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    {
        showDropdown,
        filteredDropdown,
        highlightedIndex,
        setHighlightedIndex,
        setShowDropdown,
        setNoMatchesMessage,
        handleDropdownSelect
    }: {
        showDropdown: boolean;
        filteredDropdown: Pokemon[];
        highlightedIndex: number;
        setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
        setShowDropdown: (show: boolean) => void;
        setNoMatchesMessage: (message: string | null) => void;
        handleDropdownSelect: (pokemon: Pokemon) => void;
    }
) => {
    if (e.key === "Escape") {
        setShowDropdown(false);
        setNoMatchesMessage(null);
        return;
    }

    if (e.key === "Enter") {
        e.preventDefault();
        if (!showDropdown || filteredDropdown.length === 0) {
            setNoMatchesMessage("No Pokémon found with that name");
            return;
        }
        handleDropdownSelect(filteredDropdown[highlightedIndex]);
        setNoMatchesMessage(null);
        return;
    }

    if (!showDropdown || filteredDropdown.length === 0) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev: number) =>
            prev === filteredDropdown.length - 1 ? 0 : prev + 1
        );
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev: number) =>
            prev === 0 ? filteredDropdown.length - 1 : prev - 1
        );
    }
};

const SearchDropdown: React.FC<{
    showDropdown: boolean;
    noMatchesMessage: string | null;
    filteredDropdown: Pokemon[];
    searchQuery: string;
    highlightedIndex: number;
    handleDropdownSelect: (pokemon: Pokemon) => void;
}> = ({
          showDropdown,
          noMatchesMessage,
          filteredDropdown,
          searchQuery,
          highlightedIndex,
          handleDropdownSelect,
      }) => {
    return (
        <>
            {noMatchesMessage && (
                <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -10}}
                    className="absolute top-[52px] w-full p-3 bg-red-100 text-red-800 rounded-md shadow-md z-10 border text-center"
                    data-testid="no-results"
                >
                    {noMatchesMessage}
                </motion.div>
            )}

            <AnimatePresence>
                {showDropdown && filteredDropdown.length > 0 && (
                    <motion.ul
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        transition={{duration: 0.2}}
                        className="absolute top-[52px] max-w-sm w-full bg-white rounded-md shadow-md z-10 border max-h-64 overflow-y-auto overscroll-contain"
                    >
                        {filteredDropdown.slice(0, 15).map((pokemon, index) => (
                            <DropdownItem
                                key={pokemon.name}
                                pokemon={pokemon}
                                index={index}
                                searchQuery={searchQuery}
                                highlightedIndex={highlightedIndex}
                                handleDropdownSelect={handleDropdownSelect}
                            />
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </>
    );
};

const DropdownItem: React.FC<{
    pokemon: Pokemon;
    index: number;
    searchQuery: string;
    highlightedIndex: number;
    handleDropdownSelect: (pokemon: Pokemon) => void;
}> = ({pokemon, index, searchQuery, highlightedIndex, handleDropdownSelect}) => (
    <Link href={`/pokemon/${capitalizeFirstLetter(pokemon.name)}`}>
        <li
            id={`dropdown-item-${index}`}
            onClick={() => handleDropdownSelect(pokemon)}
            className={`px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800 ${
                highlightedIndex === index ? "bg-blue-100" : ""
            }`}
        >
            <span data-testid={`pokemon-card-${pokemon.name}`}>
                {renderHighlightedText(pokemon.name, searchQuery)}
            </span>
        </li>
    </Link>
);

function renderHighlightedText(text: string, query: string) {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const start = lowerText.indexOf(lowerQuery);
    if (start === -1) return text;

    const end = start + query.length;
    return (
        <>
            {text.slice(0, start)}
            <span className="font-bold text-blue-600">{text.slice(start, end)}</span>
            {text.slice(end)}
        </>
    );
}
