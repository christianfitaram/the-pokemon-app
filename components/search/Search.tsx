"use client";
import {useCallback, useEffect, useRef, useState} from "react";
import {Pokemon, SearchProps} from "@/types/interfaces";
import {useRecentlyViewed} from "@/hooks/useRecentlyViewed";
import {useAllPokemonNames} from "@/hooks/useAllPokemonNames";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

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

    const dropdownRef = useRef<HTMLDivElement>(null);
    const {recent} = useRecentlyViewed();
    const {pokemonNames} = useAllPokemonNames();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const computeIntersection = (pokemonsByType: Pokemon[][]): Pokemon[] => {
        if (pokemonsByType.length === 0) return [];
        return pokemonsByType.reduce((acc, current) => {
            return acc.filter((pokemon) =>
                current.some((p) => p.name === pokemon.name)
            );
        }, pokemonsByType[0]);
    };

    const fetchByTypes = useCallback(async (types: string[]) => {
        const responses = await Promise.all(
            types.map((type) => PokemonApiClient.getPokemonsByType(type))
        );
        const pokemonsByType = responses
            .filter((response): response is { success: true; data: Pokemon[] } => !!response.success && !!response.data)
            .map((response) => response.data);
        return computeIntersection(pokemonsByType);
    }, []);

    useEffect(() => {
        const fetchPokemonByType = async () => {
            if (selectedTypes.length === 0) {
                onChange([]);
                return;
            }

            try {
                setTypeLoading(true);
                setIsSearchOn(true);
                const filteredPokemons = await fetchByTypes(selectedTypes);

                onChange(filteredPokemons);
            } catch (error) {
                console.error('Error fetching Pokemon by type:', error);
            } finally {
                setTypeLoading(false);
            }
        };

        fetchPokemonByType();
    }, [selectedTypes, onChange, setTypeLoading, setIsSearchOn, fetchByTypes]);

    const handleTypeSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextType = event.target.value;
        if (nextType && !selectedTypes.includes(nextType)) {
            setSelectedTypes((prev) => [...prev, nextType]);
            setSelectedType("");
        }
    };

    const removeType = async (type: string) => {
        const updatedTypes = selectedTypes.filter((selected) => selected !== type);
        setSelectedTypes(updatedTypes);
        setSelectedType(undefined);

        if (updatedTypes.length === 0) {
            setIsSearchOn(false);
            onChange([]);
            return;
        }

        try {
            setTypeLoading(true);
            const filteredPokemons = await fetchByTypes(updatedTypes);
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
        onChange([]);
    };


    const filteredDropdown = pokemonNames.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="background-muted bg-gray-400 flex flex-col items-center w-full mb-4 py-4 relative gap-6">
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
