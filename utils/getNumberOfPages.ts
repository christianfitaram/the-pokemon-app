export const getNumberOfPages = (total: number, limit: number) => {
    return Math.ceil(total / limit);
}
