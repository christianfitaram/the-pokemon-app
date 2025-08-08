import {NextRequest} from "next/server";
import { pool } from "@/lib/db/pgvector";
import { PokemonDetails } from "@/types/interfaces";
import OpenAI from "openai";


export async function getPokemonByNormalizedName(pokemonName: string) {
    const normalizedInputName = pokemonName.toLowerCase().replace(/\s+/g, "");

    const { rows } = await pool.query(
        `
      SELECT name,
             types,
             abilities,
             stats,
             color,
             habitat,
             description,
             image,
             evolution_chain,
             evolution_tree
      FROM pokemon_embeddings
      WHERE name_normalized = $1
      LIMIT 1
    `,
        [normalizedInputName]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function POST(req: NextRequest) {
    const {message, pokemon, chatHistory} = await req.json();

    const messages = [
        {
            role: "system",
            content:
                "You are a Pokémon who talks in the first person. Use the function getPokemonInfo to get data.",
        },
        ...(chatHistory ?? []),
        {role: "user", content: message},
    ];

    // First call to check if function should be called
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: [
            {
                type: "function",
                function: {
                    name: "getPokemonInfo",
                    description: "Gets a summary information of a specific Pokémon",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Name of the Pokémon" },
                        },
                        required: ["name"],
                    },
                },
            },
        ],
        tool_choice: "auto", // let the model decide
    });


    const messageResponse = response.choices[0].message;

    if (messageResponse.tool_calls?.length) {
        // If function call detected
        const toolCall = messageResponse.tool_calls[0];
        const funcArgs = JSON.parse(toolCall.function.arguments);
        const pokeName = funcArgs.name || pokemon;

        const pokeRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokeName.toLowerCase()}`
        );
        const specieRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokeName.toLowerCase()}`
        );
        if (!pokeRes.ok) {
            return new Response(
                JSON.stringify({
                    reply: `I couldn't find information for ${pokeName}.`,
                }),
                {status: 200, headers: {"Content-Type": "application/json"}}
            );
        }
        const dbData = await getPokemonByNormalizedName(pokeName);
        const evolutionChainSentence = dbData.evolution_chain?.length > 1
            ? `This Pokémon evolves from ${dbData.evolution_chain[0]} to ${dbData.evolution_chain[dbData.evolution_chain.length - 1]}.`
            : `This Pokémon does not evolve.`;

        let evolutionTreeSentence = "Evolution data unavailable.";
        try {
            const nextEvo = dbData.evolution_tree?.evolves_to?.[0]?.name;
            if (nextEvo) {
                evolutionTreeSentence = `${dbData.evolution_tree.name} evolves into ${nextEvo}.`;
            } else {
                evolutionTreeSentence = `${dbData.evolution_tree.name} does not evolve.`;
            }
        } catch {}
        const data = await pokeRes.json();
        const specieData = await specieRes.json();
        const summary = {
            base_happiness: specieData.base_happiness || null,
            name: data.name,
            abilities : data.abilities.map((a: any) => a.ability.name),
            habitat: dbData.habitat || null,
            height:(data?.height / 10).toFixed(1)+'m',
            weight:(data?.weight / 10).toFixed(1)+'kg',
            color: specieData.color.name || null,
            types: data.types.map((t: any) => t.type.name),
            stats: data.stats.map((s: any) => ({
                name: s.stat.name,
                value: s.base_stat,
            })),
            description: dbData.description || null,
            secondary_description: `${data.name} is a Pokémon of type ${data.types
                .map((t: any) => t.type.name)
                .join(", ")}.`,
            evolution_chain: evolutionChainSentence,
            evolution_tree: evolutionTreeSentence,
        };
        console.log(summary);
        // Add function response message to messages array
        const newMessages = [
            ...messages,
            {
                role: "function",
                name: "getPokemonInfo",
                content: JSON.stringify(summary),
            },
        ];

        // Second call with streaming for final assistant response
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: newMessages,
            stream: true,
        });

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        controller.enqueue(encoder.encode(chunk.choices[0].delta?.content || ""));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } else {
        // No function call, stream normal chat response
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            stream: true,
        });

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        controller.enqueue(encoder.encode(chunk.choices[0].delta?.content || ""));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    }
}
