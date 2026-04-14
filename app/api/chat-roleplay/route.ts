import { NextRequest } from "next/server";
import { pool } from "@/lib/db/pgvector";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { isOriginAllowed } from "@/lib/security/origin";
import { normalizePokemonName, roleplayRequestSchema } from "@/lib/validation/ai";
import { getAIClient, getChatModelCandidates } from "@/lib/ai/provider";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";
import type { PokemonComplete } from "@/types/chatTypes";
import { elapsedMs, incrementCounter, logEvent, observeDuration, startTimer } from "@/lib/observability";
import {
    appendRateLimitHeaders,
    buildRateLimitExceededResponse,
    consumeRateLimit,
    getClientAddress,
} from "@/lib/security/rateLimit";

type PokemonEmbeddingRow = {
    habitat?: string | null;
    description?: string | null;
    evolution_chain?: string[];
    evolution_tree?: {
        name?: string;
        evolves_to?: Array<{ name?: string }>;
    } | null;
};

type PokemonSpeciesPayload = {
    base_happiness?: number | null;
    color?: {
        name?: string | null;
    } | null;
};

type RoleplaySummary = {
    base_happiness: number | null;
    name: string;
    abilities: string[];
    habitat: string | null;
    height: string;
    weight: string;
    color: string | null;
    types: string[];
    stats: Array<{ name: string; value: number }>;
    description: string | null;
    secondary_description: string;
    evolution_chain: string;
    evolution_tree: string;
};

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

function createStreamResponse(
    requestSignal: AbortSignal,
    stream: AsyncIterable<{ choices?: Array<{ delta?: { content?: string | null } }> }>,
    metadata: { requestId: string; route: string }
) {
    const encoder = new TextEncoder();
    const encodeSseData = (payload: string) => encoder.encode(`data: ${payload}\n\n`);

    const toChunkText = (value: { choices?: Array<{ delta?: unknown }> }) => {
        const delta = value?.choices?.[0]?.delta as
            | {
                  content?: string | Array<{ text?: string }> | null;
                  refusal?: string | null;
              }
            | undefined;

        const content = (() => {
            if (!delta) return "";
            if (typeof delta.content === "string") return delta.content;
            if (Array.isArray(delta.content)) {
                return delta.content
                    .map((part) => (typeof part?.text === "string" ? part.text : ""))
                    .join("");
            }
            return "";
        })();

        const refusal = typeof delta?.refusal === "string" ? delta.refusal : "";

        if (content) {
            return { text: content, source: "content" as const };
        }
        if (refusal) {
            return { text: refusal, source: "refusal" as const };
        }
        return { text: "", source: "empty" as const };
    };

    const readableStream = new ReadableStream({
        async start(controller) {
            const iterator = stream[Symbol.asyncIterator]();
            let aborted = requestSignal.aborted;
            let emittedChunks = 0;
            let emittedChars = 0;
            let refusalChars = 0;

            const handleAbort = () => {
                aborted = true;
                const abortCount = incrementCounter(`${metadata.route}.aborts`);
                logEvent("warn", `${metadata.route}.stream_abort`, {
                    requestId: metadata.requestId,
                    abortCount,
                });
                void iterator.return?.();
                try {
                    controller.close();
                } catch {
                    // Ignore close errors on already closed stream.
                }
            };

            requestSignal.addEventListener("abort", handleAbort, { once: true });

            try {
                while (!aborted) {
                    const { value, done } = await iterator.next();
                    if (done || aborted) {
                        break;
                    }

                    const chunk = toChunkText(value as { choices?: Array<{ delta?: unknown }> });
                    if (chunk.text) {
                        emittedChunks += 1;
                        emittedChars += chunk.text.length;
                        if (chunk.source === "refusal") {
                            refusalChars += chunk.text.length;
                        }
                        controller.enqueue(encodeSseData(JSON.stringify({ type: "token", text: chunk.text })));
                    }
                }
                if (!aborted) {
                    controller.enqueue(encodeSseData("[DONE]"));
                }
                try {
                    controller.close();
                } catch {
                    // Ignore close errors on already closed stream.
                }
            } catch (error) {
                if (!aborted) {
                    const streamErrorCount = incrementCounter(`${metadata.route}.stream_errors`);
                    logEvent("error", `${metadata.route}.stream_error`, {
                        requestId: metadata.requestId,
                        streamErrorCount,
                        message: error instanceof Error ? error.message : String(error),
                    });
                    controller.error(error);
                }
            } finally {
                logEvent("info", `${metadata.route}.stream_completed`, {
                    requestId: metadata.requestId,
                    aborted,
                    emittedChunks,
                    emittedChars,
                    refusalChars,
                    emptyStream: emittedChars === 0,
                });
                requestSignal.removeEventListener("abort", handleAbort);
            }
        },
    });

    return new Response(readableStream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Request-Id": metadata.requestId,
        },
    });
}

async function getPokemonByNormalizedName(pokemonName: string): Promise<PokemonEmbeddingRow | null> {
    const normalizedInputName = pokemonName.toLowerCase().replace(/[\s-]+/g, "");

    const { rows } = await pool.query<PokemonEmbeddingRow>(
        `
          SELECT habitat,
                 description,
                 evolution_chain,
                 evolution_tree
          FROM pokemon_embeddings
          WHERE name_normalized = $1
          LIMIT 1
        `,
        [normalizedInputName]
    );

    return rows[0] ?? null;
}

async function buildRoleplaySummary(pokemonName: string): Promise<RoleplaySummary> {
    const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`;
    const [pokemonData, speciesDataRaw, dbData] = await Promise.all([
        PokemonRepository.getPokemonByName(pokemonName),
        PokemonRepository.fetchWithErrorHandling(speciesUrl),
        getPokemonByNormalizedName(pokemonName),
    ]);

    const typedPokemon = pokemonData as unknown as PokemonComplete;
    const speciesData = (speciesDataRaw ?? {}) as PokemonSpeciesPayload;

    const evolutionChainSentence = dbData?.evolution_chain && dbData.evolution_chain.length > 1
        ? `This Pokemon evolves from ${dbData.evolution_chain[0]} to ${dbData.evolution_chain[dbData.evolution_chain.length - 1]}.`
        : "This Pokemon does not evolve.";

    const nextEvolution = dbData?.evolution_tree?.evolves_to?.[0]?.name;
    const evolutionTreeSentence = nextEvolution
        ? `${dbData?.evolution_tree?.name || pokemonName} evolves into ${nextEvolution}.`
        : `${dbData?.evolution_tree?.name || pokemonName} does not evolve.`;

    const typedHeight = (typedPokemon.height / 10).toFixed(1);
    const typedWeight = (typedPokemon.weight / 10).toFixed(1);
    const types = typedPokemon.types.map((type) => type.type.name);

    return {
        base_happiness: speciesData.base_happiness ?? null,
        name: typedPokemon.name,
        abilities: typedPokemon.abilities.map((ability) => ability.ability.name),
        habitat: dbData?.habitat ?? null,
        height: `${typedHeight}m`,
        weight: `${typedWeight}kg`,
        color: speciesData.color?.name ?? null,
        types,
        stats: typedPokemon.stats.map((stat) => ({
            name: stat.stat.name,
            value: stat.base_stat,
        })),
        description: dbData?.description ?? null,
        secondary_description: `${typedPokemon.name} is a Pokemon of type ${types.join(", ")}.`,
        evolution_chain: evolutionChainSentence,
        evolution_tree: evolutionTreeSentence,
    };
}

export async function POST(req: NextRequest) {
    const route = "api.chat_roleplay";
    const requestId = crypto.randomUUID();
    const startedAt = startTimer();
    const origin = req.headers.get("origin");
    if (!origin || !isOriginAllowed(origin)) {
        return Response.json(
            { error: !origin ? "Origin header required for this endpoint" : "Unauthorized origin" },
            { status: 403 }
        );
    }

    const rateLimitResult = await consumeRateLimit(`chat-roleplay:${getClientAddress(req)}`, 60_000, 60);
    if (!rateLimitResult.allowed) {
        return buildRateLimitExceededResponse(rateLimitResult);
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

    if (!safePokemon) {
        return Response.json({ error: "Pokemon name is required" }, { status: 400 });
    }

    const normalizedChatHistory = (() => {
        if (safeChatHistory.length === 0) {
            return [{ role: "user" as const, content: safeMessage }];
        }
        const lastMessage = safeChatHistory.at(-1);
        if (lastMessage?.role === "user" && lastMessage.content === safeMessage) {
            return safeChatHistory;
        }
        return [...safeChatHistory, { role: "user" as const, content: safeMessage }];
    })();

    let roleplaySummary: RoleplaySummary | null = null;
    try {
        roleplaySummary = await buildRoleplaySummary(safePokemon);
    } catch (error) {
        const contextFailureCount = incrementCounter(`${route}.context_errors`);
        logEvent("warn", `${route}.context_error`, {
            requestId,
            contextFailureCount,
            pokemon: safePokemon,
            message: error instanceof Error ? error.message : String(error),
        });
    }

    try {
        const aiClient = getAIClient();
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content:
                    "You are a Pokemon and always talk in first person as that Pokemon. Keep replies concise, playful, and on character.",
            },
            {
                role: "system",
                content: roleplaySummary
                    ? `Pokemon context:\n${JSON.stringify(roleplaySummary)}`
                    : `Pokemon context unavailable for ${safePokemon}.`,
            },
            ...normalizedChatHistory.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        ];

        const stream = await createChatStreamWithFallback(aiClient, messages);
        const durationMs = elapsedMs(startedAt);
        observeDuration(`${route}.duration_ms`, durationMs, { outcome: "success" });
        const successCount = incrementCounter(`${route}.success`);
        logEvent("info", `${route}.success`, {
            requestId,
            successCount,
            pokemon: safePokemon,
            durationMs,
            hasRoleplayContext: Boolean(roleplaySummary),
        });
        const response = createStreamResponse(req.signal, stream, { requestId, route });
        appendRateLimitHeaders(response.headers, rateLimitResult);
        return response;
    } catch (error) {
        const durationMs = elapsedMs(startedAt);
        observeDuration(`${route}.duration_ms`, durationMs, { outcome: "error" });
        const errorCount = incrementCounter(`${route}.errors`);
        logEvent("error", `${route}.error`, {
            requestId,
            errorCount,
            pokemon: safePokemon,
            durationMs,
            message: error instanceof Error ? error.message : String(error),
        });
        const response = Response.json({ error: "Roleplay request failed" }, { status: 500 });
        appendRateLimitHeaders(response.headers, rateLimitResult);
        return response;
    }
}
