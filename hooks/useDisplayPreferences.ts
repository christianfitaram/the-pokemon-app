import { useState, useEffect } from 'react';
import { DisplayPreferences } from '@/types/interfaces';

export const useDisplayPreferences = () => {
    const [preferences, setPreferences] = useState<DisplayPreferences>({
        isListView: false,
    });

    useEffect(() => {
        const storedPreferences = localStorage.getItem('pokemonDisplayPreferences');
        if (storedPreferences) {
            try {
                const parsed = JSON.parse(storedPreferences) as Partial<DisplayPreferences>;
                setPreferences({
                    isListView: Boolean(parsed.isListView),
                });
            } catch {
                setPreferences({ isListView: false });
            }
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
