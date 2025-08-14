"use client";
import {useEffect, useRef, useState} from "react";
import {Pokemon, SearchProps, TypeApiResponse} from "@/types/interfaces";
import {useRecentlyViewed} from "@/hooks/useRecentlyViewed";
import {useAllPokemonNames} from "@/hooks/useAllPokemonNames";
import { formatURLpagination } from "@/utils/formatURLpagination";

import {SearchInput} from "./SearchInput";
import {ActionButtons} from "./ActionButtons";
import {SelectMenu} from "@/components/search/SelectMenu";
import {SelectedTypes} from "@/components/search/SelectedTypes";

const Search: React.FC<SearchProps> = ({
                                           value,
                                           onChange,
                                           setIsSearchOn,
                                           setIsUserChatting,
                                           setTypeLoading,
                                           fetchPokemonRef,
                                       }) => {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [typeFilteredPokemons, setTypeFilteredPokemons] = useState<Pokemon[]>([]);
    const [selectedType, setSelectedType] = useState<string | undefined>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [noMatchesMessage, setNoMatchesMessage] = useState<string | null>(null);
    const [allPokemonNames, setAllPokemonNames] = useState<Pokemon[]>([]);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const {recent} = useRecentlyViewed();
    const {pokemonNames} = useAllPokemonNames();

    useEffect(() => {
        setAllPokemonNames(pokemonNames);
    }, [pokemonNames]);

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
        const fetchPokemonByType = async () => {
            if (selectedTypes.length === 0) {
                setTypeFilteredPokemons([]);
                onChange([]);
                return;
            }

            try {
                setTypeLoading(true);
                setIsSearchOn(true);

                // Fetch Pokemon for each selected type
                const responses = await Promise.all(
                    selectedTypes.map(type =>
                        fetch(`https://pokeapi.co/api/v2/type/${type}`)
                            .then(res => res.json())
                            .then((data: TypeApiResponse) => data)
                    )
                );

                // Get Pokemon from all selected types
                const pokemonsByType = responses.map(response =>
                    response.pokemon.map((p: { pokemon: Pokemon }) => p.pokemon)
                );

                // Find Pokemon that exist in all selected types (intersection)
                const filteredPokemons = pokemonsByType.reduce((acc, current) => {
                    return acc.filter(pokemon =>
                        current.some(p => p.name === pokemon.name)
                    );
                }, pokemonsByType[0]);

                setTypeFilteredPokemons(filteredPokemons);
                onChange(filteredPokemons);
            } catch (error) {
                console.error('Error fetching Pokemon by type:', error);
            } finally {
                setTypeLoading(false);
            }
        };

        fetchPokemonByType();
    }, [selectedTypes, onChange, setTypeLoading, setIsSearchOn]);

    // Other utility functions and effects...
    const handleTypeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedType = event.target.value;
        if (selectedType && !selectedTypes.includes(selectedType)) {
            setSelectedTypes([...selectedTypes, selectedType]);
            setSelectedType("");
        }
    };

    const removeType = async (type: string) => {
        const updated = selectedTypes.filter((t) => t !== type);
        setSelectedTypes(updated);
        setSelectedType(undefined);
        setTypeFilteredPokemons([]);

        // All types removed → restore saved page instead of resetting to first page
        if (updated.length === 0) {
            setIsSearchOn(false);

            try {
                const saved = JSON.parse(
                    localStorage.getItem("pokemonDisplayPreferences") || '{"currentPage":0}'
                );
                const page = saved.currentPage ?? 0;
                const url = formatURLpagination(page, 24);

                if (fetchPokemonRef.current) {
                    await fetchPokemonRef.current(url, false); // don't reset to initial
                }
            } catch (e) {
                console.error("Failed to restore saved page, falling back to first page:", e);
                if (fetchPokemonRef.current) {
                    await fetchPokemonRef.current(undefined, true); // fallback
                }
            }

            onChange([]);
            return;
        }

        // Still have selected types → recompute intersection
        try {
            setTypeLoading(true);

            const responses = await Promise.all(
                updated.map((t) =>
                    fetch(`https://pokeapi.co/api/v2/type/${t}`)
                        .then((res) => res.json())
                        .then((data: TypeApiResponse) => data)
                )
            );

            const pokemonsByType = responses.map((response) =>
                response.pokemon.map((p) => p.pokemon)
            );

            const filteredPokemons = pokemonsByType.reduce((acc, current) => {
                return acc.filter((pokemon) =>
                    current.some((p) => p.name === pokemon.name)
                );
            }, pokemonsByType[0]);

            setTypeFilteredPokemons(filteredPokemons);
            onChange(filteredPokemons);
            setIsSearchOn(true);
        } catch (error) {
            console.error("Error updating filtered Pokemon:", error);
        } finally {
            setTypeLoading(false);
        }
    };

    const handleDropdownSelect = (pokemon: Pokemon) => {
        onChange([pokemon]);
        setIsSearchOn(true);
        setShowDropdown(false);
        setSearchQuery(pokemon.name);
    };

    // Action handlers
    const toListRecentlyViewed = () => {
        const pokemonRecent = recent.map(poke => ({
            name: poke.name,
            url: poke.url,
            viewedAt: poke.viewedAt,
        }));
        onChange(pokemonRecent);
        setIsSearchOn(true);
    };

    const goToHome = async () => {
        setIsSearchOn(false);
        setSelectedTypes([]);

        try {
            const saved = JSON.parse(
                localStorage.getItem("pokemonDisplayPreferences") || '{"currentPage":0}'
            );
            const page = saved.currentPage ?? 0;
            const url = formatURLpagination(page, 24);

            if (fetchPokemonRef.current) {
                await fetchPokemonRef.current(url, false);
            }
        } catch (e) {
            console.error("Failed to restore saved page, falling back to first page:", e);
            if (fetchPokemonRef.current) {
                await fetchPokemonRef.current(undefined, true);
            }
        }
    };


    const filteredDropdown = allPokemonNames.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="background-muted bg-gray-400 flex flex-col items-center w-full mb-4 py-4 relative gap-4">
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

            <ActionButtons
                goToHome={goToHome}
                toListRecentlyViewed={toListRecentlyViewed}
                showAssistantChat={() => setIsUserChatting(true)}
            />
        </div>
    );
};

export default Search;
