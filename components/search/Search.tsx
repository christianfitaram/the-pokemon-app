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
        setSearchQuery("");
        setShowDropdown(false);
        setHighlightedIndex(0);
        setNoMatchesMessage(null);
        setTypeError(null);
        onChange([]);
    };

    const clearSearch = () => {
        setSearchQuery("");
        setShowDropdown(false);
        setHighlightedIndex(0);
        setNoMatchesMessage(null);
    };

    const clearTypes = () => {
        setSelectedTypes([]);
        setSelectedType(undefined);
        setTypeError(null);
        setIsSearchOn(false);
        onChange([]);
    };


    const filteredDropdown = pokemonNames;
    const showNameSearchStatus = searchQuery.trim().length >= 2;
    const nameSearchStatusMessage = namesLoading ? "Searching Pokemon names..." : "";

    return (
        <div className="background-muted flex flex-col items-center w-full mt-8 mb-4 py-6 relative gap-6 rounded-b-[2rem] border-b border-white/5 shadow-2xl">
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
                    onClear={clearSearch}
                    handleDropdownSelect={handleDropdownSelect}
                />
            </div>

            <div className="w-full max-w-4xl px-4 text-center text-sm text-slate-300">
                Search by name, or combine types to build a focused result set. Filters stay visible until you clear them.
            </div>

            <SelectMenu
                handleTypeSelect={handleTypeSelect}
                selectedType={selectedType}
            />

            <SelectedTypes
                selectedTypes={selectedTypes}
                removeType={removeType}
                onClearAll={clearTypes}
            />
            {typeError && (
                <div className="w-full max-w-2xl rounded-3xl border border-red-400/30 bg-red-950/40 p-4 shadow-lg">
                    <p className="text-red-200 text-sm" role="alert" aria-live="assertive">
                        {typeError}
                    </p>
                    <button
                        type="button"
                        onClick={() => setTypeRetryNonce((value) => value + 1)}
                        className="mt-3 rounded-full border border-red-300/60 px-4 py-2 text-red-100 transition hover:bg-red-900/40"
                    >
                        Retry type search
                    </button>
                </div>
            )}
            <div className="h-5" aria-live="polite">
                <p
                    className={`text-sm text-gray-200 transition-opacity duration-150 ${
                        showNameSearchStatus && namesLoading ? "opacity-100" : "opacity-0"
                    }`}
                    role="status"
                >
                    {nameSearchStatusMessage}
                </p>
            </div>

            <ActionButtons
                goToHome={goToHome}
                toListRecentlyViewed={toListRecentlyViewed}
                showAssistantChat={() => setIsUserChatting(true)}
            />
        </div>
    );
};

export default Search;
