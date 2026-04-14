"use client";
import {useEffect, useRef, useState} from "react";
import {Pokemon, SearchProps} from "@/types/interfaces";
import {useRecentlyViewed} from "@/hooks/useRecentlyViewed";
import {useAllPokemonNames} from "@/hooks/useAllPokemonNames";
import { searchEngine } from "@/lib/searchEngine";

import {SearchInput} from "./SearchInput";
import {ActionButtons} from "./ActionButtons";
import {SelectMenu} from "@/components/search/SelectMenu";
import {SelectedTypes} from "@/components/search/SelectedTypes";

const Search: React.FC<SearchProps> = ({
                                           onChange,
                                           setIsSearchOn,
                                           setIsUserChatting,
                                           setTypeLoading,
                                       }) => {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<string | undefined>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [typeError, setTypeError] = useState<string | null>(null);
    const [typeRetryNonce, setTypeRetryNonce] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const {recent} = useRecentlyViewed();
    const {pokemonNames, loading: namesLoading} = useAllPokemonNames(searchQuery);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const fetchPokemonByType = async () => {
            if (selectedTypes.length === 0) {
                setIsSearchOn(false);
                onChange([]);
                setTypeLoading(false);
                setTypeError(null);
                return;
            }

            try {
                setTypeLoading(true);
                setTypeError(null);
                setIsSearchOn(true);
                const filteredPokemons = await searchEngine(selectedTypes);
                if (!isCancelled) {
                    onChange(filteredPokemons);
                }
            } catch (error) {
                console.error('Error fetching Pokemon by type:', error);
                if (!isCancelled) {
                    setTypeError("Failed to load Pokémon for selected types. Please retry.");
                }
            } finally {
                if (!isCancelled) {
                    setTypeLoading(false);
                }
            }
        };

        fetchPokemonByType();
        return () => {
            isCancelled = true;
        };
    }, [selectedTypes, onChange, setTypeLoading, setIsSearchOn, typeRetryNonce]);

    const handleTypeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextType = event.target.value;
        if (nextType && !selectedTypes.includes(nextType)) {
            setSelectedTypes((prev) => [...prev, nextType]);
            setSelectedType("");
        }
    };

    const removeType = (type: string) => {
        const updatedTypes = selectedTypes.filter((selected) => selected !== type);
        setSelectedTypes(updatedTypes);
        setSelectedType(undefined);
    };

    const handleDropdownSelect = (pokemon: Pokemon) => {
        onChange([pokemon]);
        setIsSearchOn(true);
        setShowDropdown(false);
        setSearchQuery(pokemon.name);
    };

    const toListRecentlyViewed = () => {
        const pokemonRecent = recent.map(poke => ({
            name: poke.name,
            url: poke.url,
            viewedAt: poke.viewedAt,
        }));
        onChange(pokemonRecent);
        setIsSearchOn(true);
    };

    const goToHome = () => {
        setIsSearchOn(false);
        setSelectedTypes([]);
        setTypeError(null);
        onChange([]);
    };


    const filteredDropdown = pokemonNames;

    return (
        <div className="background-muted bg-gray-400 flex flex-col items-center w-full my-4 py-4 relative gap-6">
            <div ref={dropdownRef} className="relative w-full max-w-sm">
                <SearchInput
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                    highlightedIndex={highlightedIndex}
                    setHighlightedIndex={setHighlightedIndex}
                    noMatchesMessage={noMatchesMessage}
                    setNoMatchesMessage={setNoMatchesMessage}
                    filteredDropdown={filteredDropdown}
                    handleDropdownSelect={handleDropdownSelect}
                />
            </div>

            <SelectMenu
                handleTypeSelect={handleTypeSelect}
                selectedType={selectedType}
            />

            <SelectedTypes
                selectedTypes={selectedTypes}
                removeType={removeType}
            />
            {typeError && (
                <div className="w-full max-w-2xl rounded-md border border-red-400 bg-red-950/40 p-3">
                    <p className="text-red-300 text-sm" role="alert" aria-live="assertive">
                        {typeError}
                    </p>
                    <button
                        type="button"
                        onClick={() => setTypeRetryNonce((value) => value + 1)}
                        className="mt-2 rounded border border-red-300 px-3 py-1 text-red-100 hover:bg-red-900/40"
                    >
                        Retry type search
                    </button>
                </div>
            )}
            {searchQuery.trim().length >= 2 && namesLoading && (
                <p className="text-sm text-gray-200" role="status" aria-live="polite">
                    Searching Pokémon names...
                </p>
            )}

            <ActionButtons
                goToHome={goToHome}
                toListRecentlyViewed={toListRecentlyViewed}
                showAssistantChat={() => setIsUserChatting(true)}
            />
        </div>
    );
};

export default Search;
