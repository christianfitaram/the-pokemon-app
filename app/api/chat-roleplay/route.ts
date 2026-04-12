import {NextRequest} from "next/server";
import { pool } from "@/lib/db/pgvector";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { isOriginAllowed } from "@/lib/security/origin";
import {
    normalizePokemonName,
    roleplayRequestSchema,
    roleplayToolArgsSchema,
} from "@/lib/validation/ai";
import { getAIClient, getChatModelCandidates } from "@/lib/ai/provider";

type RoleplayTool = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, { type: string; description: string }>;
            required: string[];
        };
    };
};

async function createChatCompletionWithFallback(
    aiClient: ReturnType<typeof getAIClient>,
    messages: ChatCompletionMessageParam[],
    options?: {
        tools?: RoleplayTool[];
        tool_choice?: "auto";
    }
) {
    const models = getChatModelCandidates();
    let lastError: string | null = null;

    for (const model of models) {
        try {
            return await aiClient.chat.completions.create({
                model,
                messages,
                ...options,
            });
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
    }

    throw new Error(
        `Unable to generate chat completion with configured provider/models. Last error: ${lastError ?? "unknown"}`
    );
}

async function createChatStreamWithFallback(
    aiClient: ReturnType<typeof getAIClient>,
    messages: ChatCompletionMessageParam[]
) {
    const models = getChatModelCandidates();
    let lastError: string | null = null;

    for (const model of models) {
        try {
            return await aiClient.chat.completions.create({
                model,
                messages,
                stream: true,
            });
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
    }

    throw new Error(
        `Unable to generate chat stream with configured provider/models. Last error: ${lastError ?? "unknown"}`
    );
}


async function getPokemonByNormalizedName(pokemonName: string) {
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

export async function POST(req: NextRequest) {
    const origin = req.headers.get("origin");
    if (!origin || !isOriginAllowed(origin)) {
        return Response.json(
            { error: !origin ? "Origin header required for this endpoint" : "Unauthorized origin" },
            { status: 403 }
        );
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedBody = roleplayRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
        return Response.json(
            {
                error: "Invalid request body",
                details: parsedBody.error.flatten(),
            },
            { status: 400 }
        );
    }

    const safeMessage = parsedBody.data.message;
    const safePokemon = normalizePokemonName(parsedBody.data.pokemon);
    const safeChatHistory = parsedBody.data.chatHistory;
    const aiClient = getAIClient();

    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content:
                "You are a Pokémon who talks in the first person. Use the function getPokemonInfo to get data.",
        },
        ...safeChatHistory.map((message) => ({
            role: message.role,
            content: message.content,
        })),
        {role: "user", content: safeMessage},
    ];

    // First call to check if function should be called
    const response = await createChatCompletionWithFallback(aiClient, messages, {
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
        const toolCall = messageResponse.tool_calls[0];
        let pokeName = safePokemon;
        const rawToolArgs = toolCall.function.arguments;
        const parsedToolArgs = roleplayToolArgsSchema.safeParse(
            (() => {
                try {
                    return JSON.parse(rawToolArgs);
                } catch {
                    return null;
                }
            })()
        );
        if (parsedToolArgs.success) {
            pokeName = normalizePokemonName(parsedToolArgs.data.name);
        }
        if (!pokeName) {
            return Response.json({ error: "Pokemon name is required" }, { status: 400 });
        }

        const pokeRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokeName}`
        );
        const specieRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokeName}`
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
        const evolutionChainSentence = dbData?.evolution_chain?.length > 1
            ? `This Pokémon evolves from ${dbData.evolution_chain[0]} to ${dbData.evolution_chain[dbData.evolution_chain.length - 1]}.`
            : `This Pokémon does not evolve.`;

        let evolutionTreeSentence = "Evolution data unavailable.";
        try {
            const nextEvo = dbData?.evolution_tree?.evolves_to?.[0]?.name;
            if (nextEvo) {
                evolutionTreeSentence = `${dbData?.evolution_tree?.name} evolves into ${nextEvo}.`;
            } else {
                evolutionTreeSentence = `${dbData?.evolution_tree?.name || pokeName} does not evolve.`;
            }
        } catch {}
        const data = await pokeRes.json();
        const specieData = await specieRes.json();
        const summary = {
            base_happiness: specieData.base_happiness || null,
            name: data.name,
            abilities : data.abilities.map((a: { ability: { name: string } }) => a.ability.name),
            habitat: dbData?.habitat || null,
            height:(data?.height / 10).toFixed(1)+'m',
            weight:(data?.weight / 10).toFixed(1)+'kg',
            color: specieData.color.name || null,
            types: data.types.map((t: { type: { name: string } }) => t.type.name),
            stats: data.stats.map((s: { stat: { name: string }; base_stat: number }) => ({
                name: s.stat.name,
                value: s.base_stat,
            })),
            description: dbData?.description || null,
            secondary_description: `${data.name} is a Pokémon of type ${data.types
                .map((t: { type: { name: string } }) => t.type.name)
                .join(", ")}.`,
            evolution_chain: evolutionChainSentence,
            evolution_tree: evolutionTreeSentence,
        };
        // Add function response message to messages array
        const newMessages: ChatCompletionMessageParam[] = [
            ...messages,
            {
                role: "assistant",
                content: null,
                tool_calls: messageResponse.tool_calls,
            },
            {
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(summary),
            },
        ];

        // Second call with streaming for final assistant response
        const stream = await createChatStreamWithFallback(aiClient, newMessages);

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
        const stream = await createChatStreamWithFallback(aiClient, messages);

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
