export default function formatPokemonForContext(pokemon: any): string {
    const {
        name,
        height_dm,
        weight_hg,
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

    const normalizedAbilities = Array.isArray(abilities)
        ? abilities
            .map((ability: any) => {
                if (typeof ability === "string") return ability;
                if (ability?.name) return ability.name;
                if (ability?.ability?.name) return ability.ability.name;
                return null;
            })
            .filter(Boolean)
        : [];

    const normalizedStats = Array.isArray(stats)
        ? Object.fromEntries(
            stats
                .map((entry: any) => [entry?.name || entry?.stat?.name, entry?.value ?? entry?.base_stat])
                .filter(([key, value]) => Boolean(key) && Number.isFinite(Number(value)))
        )
        : stats || {};

    const statLines = Object.entries(normalizedStats)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

    let output = `
Name: ${name}
Height: ${typeof height_dm === "number" ? `${(height_dm / 10).toFixed(1)} m` : "unknown"}
Weight: ${typeof weight_hg === "number" ? `${(weight_hg / 10).toFixed(1)} kg` : "unknown"}
Types: ${types.join(", ")}
Abilities: ${normalizedAbilities.join(", ")}
Color: ${color}
Habitat: ${habitat}
Stats: ${statLines}
Description: ${description}
Image URL: ${image}
`.trim();

    if (evolution_chain?.length) {
        output += `\nEvolution Chain: ${evolution_chain.join(" → ")}`;
    }

    // Only add evolution tree if it exists
    if (evolution_tree) {
        output += `\nEvolution Tree:\n${renderEvolutionTree(evolution_tree)}`;
    }

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
