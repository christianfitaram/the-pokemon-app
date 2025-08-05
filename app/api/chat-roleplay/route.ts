import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const functions = [
  {
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
];

export async function POST(req: NextRequest) {
  const { message, pokemon, chatHistory } = await req.json();

  const messages = [
    {
      role: "system",
      content:
        "You are a Pokémon who talks in the first person. Use the function getPokemonInfo to get data.",
    },
    ...(chatHistory ?? []),
    { role: "user", content: message },
  ];

  // First call to check if function should be called
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    functions,
    function_call: "auto",
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

    if (!pokeRes.ok) {
      return new Response(
        JSON.stringify({
          reply: `I couldn't find information for ${pokeName}.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await pokeRes.json();

    const summary = {
      name: data.name,
      types: data.types.map((t: any) => t.type.name),
      stats: data.stats.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      description: `${data.name} is a Pokémon of type ${data.types
        .map((t: any) => t.type.name)
        .join(", ")}.`,
    };

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
