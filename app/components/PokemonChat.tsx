// components/PokemonChat.tsx
import { useState, useRef, useEffect } from "react";
import { capitalizeFirstLetter } from "../utils/functions";
import { PokemonDetails } from "@/types/types";
import { FaCommentDots, FaUser, FaLongArrowAltLeft } from "react-icons/fa";
import TypingIndicator from "./TypingIndicator";

export default function PokemonChat({
  pokemon,
  onClick,
}: {
  pokemon: PokemonDetails;
  onClick: () => void;
}) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! I'm ${pokemon.name}, want to chat?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pokemonName = pokemon.name;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pokemon: pokemon.name,
        chatHistory: newMessages,
      }),
    });
    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };
  return (
    <div className="bg-body-chat w-full rounded-b-3xl">
      <div className="flex flex-col p-4">
        <div className="mb-2 font-bold text-lg ">
          <div className="flex rounded-t-3xl flex-row bg-header-chat p-4 items-center justify-between">
            <div className="flex flex-col">
              <h1 className="primary-color">
                {capitalizeFirstLetter(pokemonName)}
              </h1>
              <div className="flex flex-row gap-1 text-gray-200">
                <span className="font-thin">Type:</span>
                <span>
                  {pokemon.types.map((type, index) => {
                    const typeName = type.type.name;
                    const lastIndex = pokemon.types.length - 1;

                    if (index === 0) return typeName;
                    if (index === lastIndex) return ` and ${typeName}`;
                    return `, ${typeName}`;
                  })}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="bg-icon-header rounded-full p-2">
                <FaCommentDots className="h-6 w-6 text-gray-200" />
              </span>
            </div>
          </div>
          <div
            ref={messagesEndRef}
            className="h-64 overflow-y-auto p-2 bg-body-chat mb-2"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`primary-color flex flex-wrap gap-3 items-center mb-2 ${
                    msg.role === "user" ? "text-right justify-end" : "text-left"
                  }`}
                >
                  {msg.role === "user" ? (
                    <>
                      You
                      <span className="bg-icon-header rounded-full p-2">
                        <FaUser className="h-6 w-6" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-icon-header rounded-full p-2">
                        <img
                          src={
                            pokemon.sprites.other["official-artwork"]
                              .front_default
                          }
                          alt={pokemon.name}
                          className="h-6 w-6"
                        />
                      </span>
                      {capitalizeFirstLetter(pokemonName)}
                    </>
                  )}
                </div>
                <div
                  className={`${
                    msg.role === "user"
                      ? "bg-bubble-1 text-right"
                      : "bg-bubble-2 text-left"
                  } w-fit inline-block px-3 py-1 rounded font-[family-name:var(--font-geist-mono)] text-gray-200 `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <PokemonIsWriting pokemon={pokemon} />}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something..."
            className="font-[family-name:var(--font-geist-mono)] border rounded-xl w-full p-2 mb-2 bg-body-chat text-gray-200"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Talking..." : "Send"}
          </button>
        </div>
        <div className="flex flex-row justify-start ml-2 mb-2">
          <button onClick={onClick}>
            Back
            <FaLongArrowAltLeft className="h-8 w-10 text-gray-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

const PokemonIsWriting = ({ pokemon }: { pokemon: PokemonDetails }) => {
  const name = pokemon.name;
  return (
    <div className="mb-2 flex flex-col text-left items-start">
      <div className="flex flex-row primary-color flex-wrap gap-3 mb-2 items-center">
        <span className="bg-icon-header rounded-full p-2">
          <img
            src={pokemon.sprites.other["official-artwork"].front_default}
            alt={pokemon.name}
            className="h-6 w-6"
          />
        </span>
        {capitalizeFirstLetter(name)}
      </div>
      <div className="bg-bubble-2 text-left w-fit inline-block px-3 py-1 rounded">
        <TypingIndicator />
      </div>
    </div>
  );
};
