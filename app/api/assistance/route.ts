import {NextRequest} from "next/server";
import OpenAI from "openai";
import {pool} from "@/lib/db/pgvector";
import formatPokemonForContext from "@/utils/formatPokemonForContextAPI";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function POST(req: NextRequest) {
    const {chatHistory} = await req.json();
    const userMessage = chatHistory.at(-1)?.content || "Find a Pokémon";

    // Step 1: Embed the user query
    const embeddingResponse = await openai.embeddings.create({
        input: userMessage,
        model: "text-embedding-3-small",
    });
    const embedding = embeddingResponse.data[0].embedding;
    const embeddingStr = `[${embedding.join(",")}]`;

    // Step 2: Query the most similar Pokémon from pgvector
    const {rows: pokemons} = await pool.query(
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
            ORDER BY embedding <-> $1::vector
    LIMIT 5
        `,
        [embeddingStr]
    );

    // Step 3: Compose the assistant's understanding with RAG context
    const messages = [
        {
            role: "system",
            content: "You are a helpful assistant specialized in Pokémon knowledge. Use the provided context to answer user questions with accurate, relevant Pokémon matches.",
        },
        {
            role: "function",
            name: "retrievedPokemonContext",
            content: pokemons.length
                ? pokemons.map((p) => formatPokemonForContext(p)).join("\n\n")
                : "No matching Pokémon found.",

        },
        ...chatHistory,
        {
            role: "user",
            content: userMessage,
        },
    ];

    // Step 4: Stream GPT-4o-mini response
    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        temperature: 0.3,
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


