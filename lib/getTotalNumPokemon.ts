export const getTotalNumPokemon = async (): Promise<number> => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error fetching total number of Pokemon:', error);
        return 0;
    }
};
