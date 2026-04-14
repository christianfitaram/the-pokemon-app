import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import {ChatMessage, UnifiedChatProps} from "@/types/interfaces";
import { FaUser, FaRobot, FaPlusCircle, FaLongArrowAltLeft } from "react-icons/fa";
import TypingIndicator from "./TypingIndicator";
import { motion } from "framer-motion";
import {chatApi} from "@/lib/api_clients/pokemonApiClient";
import Image from "next/image";
import { marked } from "marked";

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const MAX_CHAT_HISTORY_MESSAGES = 30;
const FIRST_CHUNK_TIMEOUT_MS = 20000;
const STREAM_SETTLE_TIMEOUT_MS = 2500;
const DEBUG_CHAT_STREAM = true;

function trimChatHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_CHAT_HISTORY_MESSAGES) {
    return messages;
  }
  return messages.slice(-MAX_CHAT_HISTORY_MESSAGES);
}

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

function normalizeAssistantStreamText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.includes("data:")) {
    return content;
  }

  const extractedTokens: string[] = [];
  const eventBlocks = trimmed.split(/\r?\n\r?\n/);

  for (const block of eventBlocks) {
    const dataLines = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());

    if (dataLines.length === 0) {
      continue;
    }

    const payload = dataLines.join("\n");
    if (payload === "[DONE]") {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as { type?: string; text?: string };
      if (parsed?.type === "token" && typeof parsed.text === "string") {
        extractedTokens.push(parsed.text);
      }
    } catch {
      extractedTokens.push(payload);
    }
  }

  return extractedTokens.length > 0 ? extractedTokens.join("") : content;
}

const MessageBody = memo(function MessageBody({ message }: { message: ChatMessage }) {
  const assistantHtml = useMemo(() => {
    if (message.role !== "assistant") {
      return null;
    }
    return toSafeMarkdownHtml(normalizeAssistantStreamText(message.content));
  }, [message.role, message.content]);

  if (message.role === "assistant") {
    return (
      <div
        className="markdown-chat leading-relaxed [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-inside [&_ol]:list-inside [&_ul]:pl-1 [&_ol]:pl-1 [&_li]:my-0 [&_li>p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-slate-900 [&_pre]:p-2 [&_code]:break-all"
        dangerouslySetInnerHTML={{ __html: assistantHtml || "" }}
      />
    );
  }

  return <span className="whitespace-pre-wrap">{message.content}</span>;
});

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
  const emptyMessagesRef = useRef<ChatMessage[]>([]);

  // Use external or internal messages based on chat type
  const messages = useMemo(
    () => (chatType === "assistant" ? (externalMessages ?? emptyMessagesRef.current) : internalMessages),
    [chatType, externalMessages, internalMessages]
  );
  const setMessages = useMemo(
    () => (chatType === "assistant" ? (externalSetMessages ?? setInternalMessages) : setInternalMessages),
    [chatType, externalSetMessages]
  );

  const [input, setInput] = useState("");
  const [isAwaitingFirstChunk, setIsAwaitingFirstChunk] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
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
      setIsAwaitingFirstChunk(false);
      setIsStreaming(false);
    }
  }, []);

  const isBusy = isAwaitingFirstChunk || isStreaming;

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const trimmedInput = (overrideInput ?? input).trim();
    if (!trimmedInput || isBusy) return;

    cancelInFlightRequest();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: ChatMessage = { role: "user", content: trimmedInput };
    const newMessages = trimChatHistory([...messages, userMessage]);
    setMessages(newMessages);
    if (!overrideInput) {
      setInput("");
    }
    setLastFailedInput(null);
    setIsAwaitingFirstChunk(true);
    setIsStreaming(true);
    let firstChunkReceived = false;
    let requestId: string | null = null;
    const withRequestId = (message: string) =>
      requestId ? `${message} (request id: ${requestId})` : message;

    try {
      const res = chatType === "pokemon"
        ? await chatApi.roleplay(trimmedInput, pokemon!.name, newMessages, controller.signal)
        : await chatApi.assistant(newMessages, controller.signal);
      const responseClone = typeof res.clone === "function" ? res.clone() : null;
      requestId = res.headers.get("x-request-id")?.trim() || null;
      const contentType = res.headers.get("content-type")?.toLowerCase() || "";

      if (DEBUG_CHAT_STREAM && typeof window !== "undefined") {
        console.debug("[UnifiedChat] stream response", {
          chatType,
          requestId,
          contentType,
          hasBody: Boolean(res.body),
        });
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMessage = "";
      let sseBuffer = "";
      let rawAccumulator = "";
      let sawSseDataFrame = false;
      let chunkCount = 0;
      let streamSettleTimeout: number | null = null;

      const clearStreamSettleTimeout = () => {
        if (streamSettleTimeout !== null) {
          window.clearTimeout(streamSettleTimeout);
          streamSettleTimeout = null;
        }
      };

      const scheduleStreamSettleTimeout = () => {
        clearStreamSettleTimeout();
        streamSettleTimeout = window.setTimeout(() => {
          if (firstChunkReceived && !controller.signal.aborted) {
            if (DEBUG_CHAT_STREAM && typeof window !== "undefined") {
              console.debug("[UnifiedChat] stream settle timeout", {
                chatType,
                requestId,
                assistantMessageLength: assistantMessage.length,
              });
            }
            setIsAwaitingFirstChunk(false);
            setIsStreaming(false);
            controller.abort();
          }
        }, STREAM_SETTLE_TIMEOUT_MS);
      };

      const parseSseBuffer = () => {
        let updated = false;
        let doneReceived = false;

        while (true) {
          const separatorMatch = sseBuffer.match(/\r?\n\r?\n/);
          if (!separatorMatch || separatorMatch.index === undefined) {
            break;
          }

          const separatorIndex = separatorMatch.index;
          const separatorLength = separatorMatch[0].length;
          const rawEvent = sseBuffer.slice(0, separatorIndex);
          sseBuffer = sseBuffer.slice(separatorIndex + separatorLength);

          const dataLines = rawEvent
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart());

          if (dataLines.length === 0) {
            continue;
          }

          sawSseDataFrame = true;

          const payload = dataLines.join("\n");
          if (payload === "[DONE]") {
            doneReceived = true;
            break;
          }

          let tokenText = "";
          try {
            const parsed = JSON.parse(payload) as { type?: string; text?: string };
            if (parsed?.type === "token" && typeof parsed.text === "string") {
              tokenText = parsed.text;
            }
          } catch {
            tokenText = payload;
          }

          if (tokenText) {
            assistantMessage += tokenText;
            updated = true;
          }
        }

        return { updated, doneReceived };
      };

      const commitAssistantMessage = () => {
        const normalizedAssistantMessage = normalizeAssistantStreamText(assistantMessage);
        setMessages((msgs) => {
          if (msgs[msgs.length - 1]?.role !== "assistant") {
            return trimChatHistory([
              ...msgs,
              { role: "assistant", content: normalizedAssistantMessage },
            ]);
          }
          const updated = [...msgs];
          updated[updated.length - 1] = {
            role: "assistant",
            content: normalizedAssistantMessage,
          };
          return trimChatHistory(updated);
        });
      };
      const firstChunkTimeout = window.setTimeout(() => {
        if (!firstChunkReceived && !controller.signal.aborted) {
          controller.abort();
        }
      }, FIRST_CHUNK_TIMEOUT_MS);

      while (!done && !controller.signal.aborted) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (controller.signal.aborted) {
          break;
        }
        if (value && isMountedRef.current) {
          const chunk = decoder.decode(value, { stream: true });
          chunkCount += 1;
          if (DEBUG_CHAT_STREAM && typeof window !== "undefined" && chunkCount <= 5) {
            console.debug("[UnifiedChat] stream chunk", {
              chatType,
              requestId,
              chunkCount,
              length: chunk.length,
              preview: chunk.slice(0, 200),
            });
          }
          rawAccumulator += chunk;

          if (!firstChunkReceived) {
            setIsAwaitingFirstChunk(false);
            firstChunkReceived = true;
            window.clearTimeout(firstChunkTimeout);
          }

          scheduleStreamSettleTimeout();

          sseBuffer += chunk;
          const { updated, doneReceived } = parseSseBuffer();
          if (DEBUG_CHAT_STREAM && typeof window !== "undefined" && chunkCount <= 5) {
            console.debug("[UnifiedChat] parser state", {
              chatType,
              requestId,
              chunkCount,
              sawSseDataFrame,
              sseBufferLength: sseBuffer.length,
              assistantMessageLength: assistantMessage.length,
              updated,
              doneReceived,
            });
          }
          if (updated) {
            commitAssistantMessage();
          }
          if (doneReceived) {
            setIsAwaitingFirstChunk(false);
            setIsStreaming(false);
            clearStreamSettleTimeout();
            done = true;
            controller.abort();
            break;
          }
        }
      }

      window.clearTimeout(firstChunkTimeout);
      clearStreamSettleTimeout();

      if (!controller.signal.aborted && sseBuffer.trim().length > 0) {
        const pendingEvent = sseBuffer
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");

        if (pendingEvent && pendingEvent !== "[DONE]") {
          try {
            const parsed = JSON.parse(pendingEvent) as { type?: string; text?: string };
            if (parsed?.type === "token" && typeof parsed.text === "string") {
              assistantMessage += parsed.text;
              commitAssistantMessage();
            }
          } catch {
            assistantMessage += pendingEvent;
            commitAssistantMessage();
          }
        }
      }

      if (!controller.signal.aborted && !sawSseDataFrame && assistantMessage.length === 0 && rawAccumulator.length > 0) {
        if (DEBUG_CHAT_STREAM && typeof window !== "undefined") {
          console.debug("[UnifiedChat] raw fallback", {
            chatType,
            requestId,
            rawLength: rawAccumulator.length,
            rawPreview: rawAccumulator.slice(0, 400),
          });
        }
        assistantMessage = normalizeAssistantStreamText(rawAccumulator);
        commitAssistantMessage();
      }

      if (!controller.signal.aborted && assistantMessage.length === 0) {
        const fallbackText = responseClone ? await responseClone.text().catch(() => "") : "";
        if (fallbackText.length > 0) {
          assistantMessage = normalizeAssistantStreamText(fallbackText);
          setMessages((msgs) => {
            if (msgs[msgs.length - 1]?.role !== "assistant") {
              return trimChatHistory([
                ...msgs,
                { role: "assistant", content: assistantMessage },
              ]);
            }
            const updated = [...msgs];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantMessage,
            };
            return trimChatHistory(updated);
          });
          return;
        }

        setLastFailedInput(trimmedInput);
        setMessages((msgs) => trimChatHistory([
          ...msgs,
          {
            role: "assistant",
            content: withRequestId("I could not generate a response this time. Please try again."),
          },
        ]));
      }
    } catch (error) {
      if (controller.signal.aborted) {
        if (!firstChunkReceived) {
          setLastFailedInput(trimmedInput);
          setMessages((msgs) => trimChatHistory([
            ...msgs,
            {
              role: "assistant",
              content: withRequestId("The response timed out before arriving. Please retry your message."),
            },
          ]));
        }
        return;
      }
      console.error("Error reading stream:", error);
      setLastFailedInput(trimmedInput);
      setMessages((msgs) => trimChatHistory([
        ...msgs,
        {
          role: "assistant",
          content: withRequestId("Oops, there was an error responding. You can retry your message."),
        },
      ]));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsAwaitingFirstChunk(false);
        setIsStreaming(false);
      }
    }
  }, [input, isBusy, cancelInFlightRequest, messages, setMessages, chatType, pokemon]);

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
              key={`${msg.role}-${idx}`}
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
                <MessageBody message={msg} />
              </div>
            </div>
          ))}
          {isBusy && <TypingIndicatorComponent />}
        </div>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Chat message input"
          placeholder="Ask something..."
          className="font-[family-name:var(--font-geist-mono)] border rounded-xl w-full p-3 mb-2 bg-body-chat text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isBusy}
        />
        <button
          type="button"
          onClick={() => {
            void sendMessage();
          }}
          disabled={isBusy}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        >
          {isBusy ? "Talking..." : "Send"}
        </button>
        {lastFailedInput && !isBusy && (
          <button
            type="button"
            onClick={() => sendMessage(lastFailedInput)}
            className="mt-2 border border-gray-300 text-gray-100 px-4 py-2 rounded w-full hover:bg-gray-700"
          >
            Retry last message
          </button>
        )}
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
