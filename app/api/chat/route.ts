import { PokemonComplete } from "@/types/chatTypes";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pokemon, chatHistory } = body;
    console.log(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    //1 fetch data
    const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    if (!pokeRes.ok) {
      throw new Error("Failed to fetch Pokémon details");
    }
    const data: PokemonComplete = await pokeRes.json();
    //2 sumarize data
    const pokemonSummary = {
      name: data?.name,
      type: data?.types?.map((t: any) => t.type.name),
      stats: data?.stats?.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
      abilities: data?.abilities?.map((a: any) => a.ability.name),
      description: `${data?.name} is a Pokémon of type ${data?.types
        ?.map((t: any) => t.type.name)
        .join(", ")}.`,
    };
    console.log(data.name)
    console.log(pokemon)
    //3 set message
    const messages = [
      {
        role: "system",
        content: `You are roleplaying as the Pokémon ${
          pokemonSummary.name
        }. Speak in first person. Here is your info:\n${JSON.stringify(
          pokemonSummary
        )}`,
      },
      ...chatHistory,
    ];
    //4 calling to openAI API

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.9,
      }),
    });

    const aiData = await aiRes.json();
    const reply =
      aiData.choices?.[0]?.message?.content ||
      "Sorry, I couldn't think of a response!";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("API Chat Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
