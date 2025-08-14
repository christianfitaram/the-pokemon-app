export const formatURLpagination = (page: number, limit: number = 24): string => {
    const offset = page * limit;
    return `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
};
