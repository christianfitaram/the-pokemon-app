import { useState, useEffect } from 'react';
import { DisplayPreferences } from '@/types/interfaces';

export const useDisplayPreferences = (initialPage: number = 0) => {
    const [preferences, setPreferences] = useState<DisplayPreferences>({
        isListView: false,
        currentPage: initialPage,
    });

    useEffect(() => {
        const storedPreferences = localStorage.getItem('pokemonDisplayPreferences');
        if (storedPreferences) {
            setPreferences(JSON.parse(storedPreferences));
        }
    }, []);

    const updatePreferences = (newPreferences: Partial<DisplayPreferences>) => {
        const updatedPreferences = {
            ...preferences,
            ...newPreferences,
        };
        setPreferences(updatedPreferences);
        localStorage.setItem('pokemonDisplayPreferences', JSON.stringify(updatedPreferences));
    };

    return {
        preferences,
        updatePreferences,
    };
};
