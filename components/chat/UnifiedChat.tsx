import { useState, useRef, useEffect, useCallback } from "react";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import {ChatMessage, UnifiedChatProps} from "@/types/interfaces";
import { FaUser, FaRobot, FaPlusCircle, FaLongArrowAltLeft } from "react-icons/fa";
import TypingIndicator from "./TypingIndicator";
import { motion } from "framer-motion";
import {chatApi} from "@/lib/api_clients/pokemonApiClient";
import Image from "next/image";
import { marked } from "marked";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function sanitizeMarkdownHtml(renderedHtml: string): string {
  if (typeof window === "undefined") {
    return renderedHtml;
  }

  const doc = new DOMParser().parseFromString(renderedHtml, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((node) => node.remove());

  const elements = doc.querySelectorAll("*");
  elements.forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name !== "href" && name !== "src") {
        return;
      }

      if (!value) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (value.startsWith("#") || value.startsWith("/")) {
        return;
      }

      try {
        const parsedUrl = new URL(value, window.location.origin);
        if (!SAFE_PROTOCOLS.has(parsedUrl.protocol)) {
          element.removeAttribute(attribute.name);
        }
      } catch {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName.toLowerCase() === "a" && element.getAttribute("href")) {
      element.setAttribute("rel", "noopener noreferrer nofollow");
      element.setAttribute("target", "_blank");
    }
  });

  return doc.body.innerHTML;
}

function toSafeMarkdownHtml(content: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const rendered = marked.parse(escaped, {
    gfm: true,
    breaks: true,
    async: false,
  }) as string;

  return sanitizeMarkdownHtml(rendered);
}

export default function UnifiedChat({
  chatType,
  pokemon,
  onClose,
  onBack,
  messages: externalMessages,
  setMessages: externalSetMessages,
  initialMessage,
  showBackButton = false,
  showAnimation = false,
}: UnifiedChatProps) {
  // Internal state for Pokemon chat
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>(
    chatType === "pokemon" && pokemon
      ? [{ role: "assistant", content: initialMessage || `Hi! I'm ${pokemon.name}, want to chat?` }]
      : []
  );

  // Use external or internal messages based on chat type
  const messages = chatType === "assistant" ? externalMessages! : internalMessages;
  const setMessages = chatType === "assistant" ? externalSetMessages! : setInternalMessages;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const cancelInFlightRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (isMountedRef.current) {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    cancelInFlightRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: ChatMessage = { role: "user", content: trimmedInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = chatType === "pokemon"
        ? await chatApi.roleplay(trimmedInput, pokemon!.name, newMessages, controller.signal)
        : await chatApi.assistant(newMessages, controller.signal);

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";
      let firstChunkReceived = false;

      while (!done && !controller.signal.aborted) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (controller.signal.aborted) {
          break;
        }
        if (value && isMountedRef.current) {
          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;

          if (!firstChunkReceived) {
            setLoading(false);
            firstChunkReceived = true;
          }

          setMessages((msgs) => {
            if (msgs[msgs.length - 1]?.role !== "assistant") {
              return [
                ...msgs,
                { role: "assistant", content: assistantMessage },
              ];
            }
            const updated = [...msgs];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantMessage,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error("Error reading stream:", error);
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: "Oops, there was an error responding." },
      ]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [input, loading, cancelInFlightRequest, messages, setMessages, chatType, pokemon]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleClose = useCallback(() => {
    cancelInFlightRequest();
    onClose();
  }, [cancelInFlightRequest, onClose]);

  const handleBack = useCallback(() => {
    cancelInFlightRequest();
    onBack?.();
  }, [cancelInFlightRequest, onBack]);

  const getChatTitle = () => {
    if (chatType === "pokemon" && pokemon) {
      return capitalizeFirstLetter(pokemon.name);
    }
    return "Assistant chat";
  };

  const getChatSubtitle = () => {
    if (chatType === "pokemon" && pokemon) {
      return (
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
      );
    }
    return null;
  };

  const getAssistantIcon = () => {
    if (chatType === "pokemon" && pokemon) {
      return (
        <Image
          src={pokemon.sprites.other["official-artwork"].front_default}
          alt={pokemon.name}
          width={24}
          height={24}
          className="h-6 w-6"
        />
      );
    }
    return <FaRobot className="h-6 w-6" />;
  };

  const getAssistantName = () => {
    if (chatType === "pokemon" && pokemon) {
      return capitalizeFirstLetter(pokemon.name);
    }
    return "AI Assistant";
  };

  const TypingIndicatorComponent = () => (
    <div className="mb-2 flex flex-col text-left items-start">
      <div className="flex flex-row primary-color flex-wrap gap-3 mb-2 items-center">
        <span className="bg-icon-header rounded-full p-2">
          {getAssistantIcon()}
        </span>
        {getAssistantName()}
      </div>
      <div className="bg-bubble-2 text-left w-fit inline-block px-3 py-1 rounded text-gray-200">
        <TypingIndicator />
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col p-4">
      <div className="mb-2 font-bold text-lg">
        <div className={`flex ${chatType === "pokemon" ? "rounded-t-3xl" : "rounded-t-xl"} flex-row bg-header-chat p-4 items-center justify-between`}>
          <div className="flex flex-col">
            <h1 className="primary-color">{getChatTitle()}</h1>
            {getChatSubtitle()}
          </div>
          <div className="flex flex-col">
              <button
              onClick={handleClose}
              aria-label="Close chat"
              title="Close chat"
              className="bg-icon-header rounded-full p-2 hover:bg-gray-700"
            >
              <FaPlusCircle className="h-6 w-6 rotate-45 text-white" />
            </button>
          </div>
        </div>
        <div
          ref={messagesEndRef}
          role="log"
          aria-live="polite"
          className="h-64 sm:h-72 md:h-80 lg:h-96 overflow-y-auto p-3 bg-body-chat mb-2 rounded-b-lg shadow-[inset_0_8px_16px_-4px_rgba(255,255,255,0.1)]"
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
                      {getAssistantIcon()}
                    </span>
                    {getAssistantName()}
                  </>
                )}
              </div>
              <div
                className={`${
                  msg.role === "user"
                    ? "bg-bubble-1 text-right"
                    : "bg-bubble-2 text-left"
                } w-fit max-w-[85%] sm:max-w-[80%] md:max-w-[75%] inline-block px-3 py-2 rounded-lg font-[family-name:var(--font-geist-mono)] text-gray-200 break-words`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="markdown-chat leading-relaxed [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-inside [&_ol]:list-inside [&_ul]:pl-1 [&_ol]:pl-1 [&_li]:my-0 [&_li>p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-900 [&_pre]:p-2 [&_code]:break-all"
                    dangerouslySetInnerHTML={{ __html: toSafeMarkdownHtml(msg.content) }}
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          {loading && <TypingIndicatorComponent />}
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Chat message input"
          placeholder="Ask something..."
          className="font-[family-name:var(--font-geist-mono)] border rounded-xl w-full p-3 mb-2 bg-body-chat text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        >
          {loading ? "Talking..." : "Send"}
        </button>
      </div>
      {showBackButton && onBack && (
        <div className="flex flex-row justify-start mb-2">
          <button
            type="button"
            aria-label="Back to Pokemon details"
            onClick={handleBack}
            className="text-gray-200 hover:text-gray-400 flex flex-row items-center gap-2 border border-gray-200 rounded-full px-3"
          >
            <FaLongArrowAltLeft className="h-6 w-6" />
            <span>Back</span>
          </button>
        </div>
      )}
    </div>
  );

  if (showAnimation) {
    return (
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-body-chat w-full rounded-xl border shadow-xl"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="w-full bg-body-chat border rounded-xl shadow-xl">
      {content}
    </div>
  );
}
