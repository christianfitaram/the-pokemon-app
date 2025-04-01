// components/PokemonChat.tsx
import { useState, useRef, useEffect } from "react";
import { AssistantChatProps, ChatMessage } from "@/types/types";
import {
  FaUser,
  FaRobot,
  FaPlusCircle,
} from "react-icons/fa";
import TypingIndicator from "./TypingIndicator";

const AssistantChat: React.FC<AssistantChatProps> = ({
  setIsUserChatting,
  messages,
  setMessages
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatHistory: newMessages,
      }),
    });
    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };
  return (
    <div className="w-full bg-body-chat border rounded-xl">
      <div className="mb-2 font-bold text-lg ">
        <div className="flex rounded-t-xl flex-row bg-header-chat p-4 items-center justify-between">
          <div className="flex flex-col">
            <h1 className="primary-color">Assistant chat</h1>
          </div>
          <div className="flex flex-col">
            <button
              onClick={() => setIsUserChatting(false)}
              className="bg-icon-header rounded-full p-2"
            >
              <FaPlusCircle className="h-6 w-6 rotate-45" />
            </button>
          </div>
        </div>
        <div className="flex flex-col p-4">
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
                      <span className="bg-icon-header rounded-full">
                        <FaUser className="h-6 w-6" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-icon-header rounded-full p-2">
                        <FaRobot className="h-6 w-6" />
                      </span>
                      AI Assitant
                    </>
                  )}
                </div>
                <div
                  className={`${
                    msg.role === "user"
                      ? "bg-bubble-1 text-right"
                      : "bg-bubble-2 text-left"
                  } w-fit inline-block px-3 py-1 rounded font-[family-name:var(--font-geist-mono)] `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <AssistantIsWriting />}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something..."
            className="font-[family-name:var(--font-geist-mono)] border rounded-xl w-full p-2 mb-2 bg-body-chat"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4"
          >
            {loading ? "Talking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AssistantChat;
const AssistantIsWriting = () => {
  return (
    <div className="mb-2 flex flex-col text-left items-start">
      <div className="flex flex-row primary-color flex-wrap gap-3 mb-2 items-center">
        <span className="bg-icon-header rounded-full p-2">
          <FaRobot className="h-6 w-6" />
        </span>
        AI Assitant
      </div>
      <div className="bg-bubble-2 text-left w-fit inline-block px-3 py-1 rounded">
        <TypingIndicator />
      </div>
    </div>
  );
};
