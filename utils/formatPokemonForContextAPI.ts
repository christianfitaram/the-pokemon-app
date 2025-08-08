export default function formatPokemonForContext(pokemon: any): string {
    const {
        name,
        types,
        abilities,
        stats,
        color,
        habitat,
        description,
        image,
        evolution_chain,
        evolution_tree
    } = pokemon;

    const statLines = Object.entries(stats || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

    let output = `
Name: ${name}
Types: ${types.join(", ")}
Abilities: ${abilities.join(", ")}
Color: ${color}
Habitat: ${habitat}
Stats: ${statLines}
Description: ${description}
Image URL: ${image}
`.trim();

    if (evolution_chain?.length) {
        output += `\nEvolution Chain: ${evolution_chain.join(" → ")}`;
    }
    output += `\nEvolution Tree:\n${renderEvolutionTree(evolution_tree)}`;
    return output;
}

function renderEvolutionTree(node: any, depth = 0): string {
    const indent = "  ".repeat(depth);
    const children = node.evolves_to || [];
    const lines = [`${indent}- ${node.name}`];
    for (const child of children) {
        lines.push(renderEvolutionTree(child, depth + 1));
    }
    return lines.join("\n");
}
