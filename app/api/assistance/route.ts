import { PokemonComplete } from "@/types/chatTypes";
import { data } from "framer-motion/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pokemon, chatHistory } = body;
    //1 set message
    const messages = [
      {
        role: "system",
        content:
          "You are helping me to identify pokemons based on characteristics\n",
      },
      ...chatHistory,
    ];
    //2 calling to openAI API

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
