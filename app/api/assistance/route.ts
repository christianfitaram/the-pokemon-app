import {NextRequest} from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {pool} from "@/lib/db/pgvector";
import formatPokemonForContext from "@/utils/formatPokemonForContextAPI";
import { isOriginAllowed } from "@/lib/security/origin";
import { assistanceRequestSchema } from "@/lib/validation/ai";
import {
    getAIClient,
    getChatModelCandidates,
    getEmbeddingModelCandidates,
} from "@/lib/ai/provider";
import { elapsedMs, incrementCounter, logEvent, observeDuration, startTimer } from "@/lib/observability";
import {
    appendRateLimitHeaders,
    buildRateLimitExceededResponse,
    consumeRateLimit,
    getClientAddress,
} from "@/lib/security/rateLimit";

type StatCondition = {
    stat: string;
    op: ">=" | "<=";
    value: number;
};

type StructuredFilters = {
    colors: string[];
    types: string[];
    habitats: string[];
    abilities: string[];
    stats: StatCondition[];
    sortBy: "height_desc" | "height_asc" | "weight_desc" | "weight_asc" | null;
};

const KNOWN_COLORS = [
    "black",
    "blue",
    "brown",
    "gray",
    "green",
    "pink",
    "purple",
    "red",
    "white",
    "yellow",
];

const KNOWN_TYPES = [
    "normal",
    "fire",
    "water",
    "electric",
    "grass",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dragon",
    "dark",
    "steel",
    "fairy",
];

const KNOWN_HABITATS = [
    "cave",
    "forest",
    "grassland",
    "mountain",
    "rare",
    "rough-terrain",
    "sea",
    "urban",
    "waters-edge",
];

const STAT_ALIASES: Array<{ regex: RegExp; key: string }> = [
    { regex: /special\s+attack|sp\.?\s*atk/i, key: "special-attack" },
    { regex: /special\s+defense|sp\.?\s*def/i, key: "special-defense" },
    { regex: /\bhp\b|health/i, key: "hp" },
    { regex: /\battack\b|atk/i, key: "attack" },
    { regex: /\bdefense\b|def/i, key: "defense" },
    { regex: /\bspeed\b/i, key: "speed" },
];

function extractStructuredFilters(input: string): StructuredFilters {
    const text = input.toLowerCase();
    const colors = KNOWN_COLORS.filter((value) => new RegExp(`\\b${value}\\b`, "i").test(text));
    const types = KNOWN_TYPES.filter((value) => new RegExp(`\\b${value}\\b`, "i").test(text));
    const habitats = KNOWN_HABITATS.filter((value) => {
        const relaxed = value.replace("-", "[-\\s]?");
        return new RegExp(`\\b${relaxed}\\b`, "i").test(text);
    });

    const abilities = Array.from(
        new Set(
            [
                ...text.matchAll(/(?:with|having)\s+ability\s+([a-z][a-z-]{1,40})/gi),
                ...text.matchAll(/ability\s+([a-z][a-z-]{1,40})/gi),
            ]
                .map((match) => (match[1] || "").trim().toLowerCase())
                .filter(Boolean)
        )
    );

    const stats: StatCondition[] = [];
    const statMatchers: Array<{ op: ">=" | "<="; regex: RegExp }> = [
        { op: ">=", regex: /(above|over|at\s+least|greater\s+than|>=)\s*(\d{1,3})/i },
        { op: "<=", regex: /(below|under|at\s+most|less\s+than|<=)\s*(\d{1,3})/i },
    ];

    for (const { regex: statRegex, key } of STAT_ALIASES) {
        for (const { op, regex: cmpRegex } of statMatchers) {
            const pattern = new RegExp(`${statRegex.source}[^0-9]{0,25}${cmpRegex.source}`, "i");
            const found = text.match(pattern);
            if (!found) continue;
            const value = Number(found[found.length - 1]);
            if (Number.isFinite(value)) {
                stats.push({ stat: key, op, value });
            }
        }
    }

    const sortBy = (() => {
        if (/\btallest\b|highest\s+height|largest\s+height/.test(text)) return "height_desc" as const;
        if (/\bshortest\b|lowest\s+height|smallest\s+height/.test(text)) return "height_asc" as const;
        if (/\bheaviest\b|highest\s+weight/.test(text)) return "weight_desc" as const;
        if (/\blightest\b|lowest\s+weight/.test(text)) return "weight_asc" as const;
        return null;
    })();

    return { colors, types, habitats, abilities, stats, sortBy };
}

function hasStructuredFilters(filters: StructuredFilters): boolean {
    return (
        filters.colors.length > 0 ||
        filters.types.length > 0 ||
        filters.habitats.length > 0 ||
        filters.abilities.length > 0 ||
        filters.stats.length > 0 ||
        filters.sortBy !== null
    );
}

async function getSemanticMatches(aiClient: ReturnType<typeof getAIClient>, userMessage: string) {
    const embedding = await createEmbeddingWithFallback(aiClient, userMessage);
    const embeddingStr = `[${embedding.join(",")}]`;

    const { rows } = await pool.query(
        `
            SELECT name,
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
            FROM pokemon_embeddings
            ORDER BY embedding <-> $1::vector
            LIMIT 5
        `,
        [embeddingStr]
    );

    return rows;
}

async function getStructuredMatches(filters: StructuredFilters, limit = 25) {
    const conditions: string[] = [];
    const params: Array<string[] | number | string> = [];
    let index = 1;

    if (filters.colors.length > 0) {
        conditions.push(`lower(color) = ANY($${index}::text[])`);
        params.push(filters.colors);
        index += 1;
    }

    if (filters.types.length > 0) {
        conditions.push(`types @> $${index}::text[]`);
        params.push(filters.types);
        index += 1;
    }

    if (filters.habitats.length > 0) {
        conditions.push(`lower(habitat) = ANY($${index}::text[])`);
        params.push(filters.habitats);
        index += 1;
    }

    if (filters.abilities.length > 0) {
        conditions.push(
            `EXISTS (
                SELECT 1
                FROM jsonb_array_elements(abilities) AS a
                WHERE lower(a->>'name') = ANY($${index}::text[])
            )`
        );
        params.push(filters.abilities);
        index += 1;
    }

    for (const stat of filters.stats) {
        conditions.push(`COALESCE((stats ->> $${index})::int, 0) ${stat.op} $${index + 1}`);
        params.push(stat.stat, stat.value);
        index += 2;
    }

    if (conditions.length === 0 && !filters.sortBy) {
        return [];
    }

    params.push(limit);

    let orderBy = "name ASC";
    if (filters.sortBy === "height_desc") orderBy = "height_dm DESC NULLS LAST, name ASC";
    if (filters.sortBy === "height_asc") orderBy = "height_dm ASC NULLS LAST, name ASC";
    if (filters.sortBy === "weight_desc") orderBy = "weight_hg DESC NULLS LAST, name ASC";
    if (filters.sortBy === "weight_asc") orderBy = "weight_hg ASC NULLS LAST, name ASC";

    const query = `
        SELECT name,
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
        FROM pokemon_embeddings
         WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "TRUE"}
         ORDER BY ${orderBy}
        LIMIT $${index}
    `;

    const { rows } = await pool.query(query, params);
    return rows;
}

async function getExpectedEmbeddingDimension(): Promise<number | null> {
    const result = await pool.query(
        "SELECT vector_dims(embedding) AS dim FROM pokemon_embeddings WHERE embedding IS NOT NULL LIMIT 1"
    );
    const raw = result.rows[0]?.dim;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function createEmbeddingWithFallback(aiClient: ReturnType<typeof getAIClient>, input: string) {
    const expectedDim = await getExpectedEmbeddingDimension();
    const models = getEmbeddingModelCandidates();
    let lastError: string | null = null;

    for (const model of models) {
        try {
            const response = await aiClient.embeddings.create({ input, model });
            const vector = response.data[0]?.embedding;
            if (!Array.isArray(vector) || vector.length === 0) {
                lastError = `Model ${model} returned an empty embedding vector`;
                continue;
            }

            if (expectedDim && vector.length !== expectedDim) {
                lastError = `Model ${model} returned dimension ${vector.length}, expected ${expectedDim} from table`;
                continue;
            }

            return vector;
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
    }

    throw new Error(
        `Unable to generate embeddings with configured provider/models. Last error: ${lastError ?? "unknown"}`
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
                temperature: 0.3,
            });
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
    }

    throw new Error(
        `Unable to generate chat completion with configured provider/models. Last error: ${lastError ?? "unknown"}`
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

export async function POST(req: NextRequest) {
    const route = "api.assistance";
    const requestId = crypto.randomUUID();
    const startedAt = startTimer();
    const origin = req.headers.get("origin");
    if (!origin || !isOriginAllowed(origin)) {
        return Response.json(
            { error: !origin ? "Origin header required for this endpoint" : "Unauthorized origin" },
            { status: 403 }
        );
    }

    const rateLimitResult = await consumeRateLimit(`assistance:${getClientAddress(req)}`, 60_000, 60);
    if (!rateLimitResult.allowed) {
        return buildRateLimitExceededResponse(rateLimitResult);
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedBody = assistanceRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
        return Response.json(
            {
                error: "Invalid request body",
                details: parsedBody.error.flatten(),
            },
            { status: 400 }
        );
    }

    const { chatHistory: safeChatHistory } = parsedBody.data;
    const userMessage = safeChatHistory.at(-1)?.content || "Find a Pokémon";
    const normalizedChatHistory = safeChatHistory.length
        ? safeChatHistory
        : [{ role: "user" as const, content: userMessage }];
    try {
        const aiClient = getAIClient();

        // Step 1: Prefer structured retrieval for characteristic queries; fallback to semantic retrieval.
        const structuredFilters = extractStructuredFilters(userMessage);
        const usedStructured = hasStructuredFilters(structuredFilters);
        const pokemons = usedStructured
            ? await getStructuredMatches(structuredFilters)
            : await getSemanticMatches(aiClient, userMessage);

        const finalPokemons = pokemons.length === 0 && usedStructured
            ? await getSemanticMatches(aiClient, userMessage)
            : pokemons;

        // Step 3: Compose the assistant's understanding with RAG context
        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: "You are a helpful assistant specialized in Pokémon knowledge. Use the provided context to answer user questions with accurate, relevant Pokémon matches.",
            },
            {
                role: "system",
                content: finalPokemons.length
                    ? `Retrieved Pokemon context (${usedStructured ? "structured-first" : "semantic"}):\n\n${finalPokemons.map((p) => formatPokemonForContext(p)).join("\n\n")}`
                    : "No matching Pokémon found.",

            },
            ...normalizedChatHistory.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        ];

        // Step 4: Stream model response.
        const stream = await createChatStreamWithFallback(aiClient, messages);
        const durationMs = elapsedMs(startedAt);
        observeDuration(`${route}.duration_ms`, durationMs, { outcome: "success" });
        const successCount = incrementCounter(`${route}.success`);
        logEvent("info", `${route}.success`, {
            requestId,
            successCount,
            usedStructured,
            contextCount: finalPokemons.length,
            durationMs,
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
            durationMs,
            message: error instanceof Error ? error.message : String(error),
        });
        const response = Response.json({ error: "Assistant request failed" }, { status: 500 });
        appendRateLimitHeaders(response.headers, rateLimitResult);
        return response;
    }
}
