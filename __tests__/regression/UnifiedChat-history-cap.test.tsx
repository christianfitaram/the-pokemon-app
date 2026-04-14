/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import type { ChatMessage } from "@/types/interfaces";
import type { ImgHTMLAttributes, ReactNode } from "react";

type AssistantApiFn = (typeof import("@/lib/api_clients/pokemonApiClient"))["chatApi"]["assistant"];
type AssistantApiMock = jest.MockedFunction<AssistantApiFn>;

function asAssistantApiMock(fn: AssistantApiFn): AssistantApiMock {
  return fn as AssistantApiMock;
}

if (typeof globalThis.TextDecoder === "undefined") {
  class MockTextDecoder {
    decode(input?: ArrayBufferView | ArrayBuffer | null): string {
      if (!input) return "";
      const view = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      return String.fromCharCode(...Array.from(view));
    }
  }

  (globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder =
    MockTextDecoder as unknown as typeof TextDecoder;
}

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ""} />,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

jest.mock(
  "marked",
  () => ({
    __esModule: true,
    marked: {
      parse: (value: string) => value,
    },
  }),
  { virtual: true }
);

jest.mock("@/lib/api_clients/pokemonApiClient", () => ({
  chatApi: {
    assistant: jest.fn(),
    roleplay: jest.fn(),
  },
}));

function buildStreamResponse(chunk: string): Response {
  let sent = false;
  const sse = `data: ${JSON.stringify({ type: "token", text: chunk })}\n\ndata: [DONE]\n\n`;
  const value = Uint8Array.from(sse.split("").map((char) => char.charCodeAt(0)));

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (!sent) {
            sent = true;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        },
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildSseDoneWithoutNaturalCloseResponse(chunk: string): Response {
  const payloads = [
    `data: ${JSON.stringify({ type: "token", text: chunk })}\n\n`,
    "data: [DONE]\n\n",
  ].map((entry) => Uint8Array.from(entry.split("").map((char) => char.charCodeAt(0))));

  let readIndex = 0;
  let canceled = false;

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (canceled) {
            return { value: undefined, done: true };
          }
          if (readIndex < payloads.length) {
            const value = payloads[readIndex];
            readIndex += 1;
            return { value, done: false };
          }
          return new Promise(() => {
            // Intentionally pending: the client should stop based on explicit done signal.
          });
        },
        cancel: async () => {
          canceled = true;
        },
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildKeepAliveSseResponseWithoutDone(chunk: string): Response {
  const tokenPayload = Uint8Array.from(
    (`data: ${JSON.stringify({ type: "token", text: chunk })}\n\n`)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const keepAlivePayload = Uint8Array.from(":\n\n".split("").map((char) => char.charCodeAt(0)));

  let readIndex = 0;
  const maxKeepAliveReads = 80;

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (readIndex === 0) {
            readIndex += 1;
            return { value: tokenPayload, done: false };
          }

          if (readIndex <= maxKeepAliveReads) {
            readIndex += 1;
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { value: keepAlivePayload, done: false };
          }

          return new Promise(() => {
            // Keep the reader pending to mimic a stream that never sends [DONE].
          });
        },
        cancel: async () => {},
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildInvisibleTailSseResponseWithoutDone(chunk: string): Response {
  const tokenPayload = Uint8Array.from(
    (`data: ${JSON.stringify({ type: "token", text: chunk })}\n\n`)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const invisiblePayload = Uint8Array.from(
    (`data: ${JSON.stringify({ type: "token", text: "\u007f" })}\n\n`)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  let readIndex = 0;
  const maxInvisibleReads = 100;

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (readIndex === 0) {
            readIndex += 1;
            return { value: tokenPayload, done: false };
          }

          if (readIndex <= maxInvisibleReads) {
            readIndex += 1;
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { value: invisiblePayload, done: false };
          }

          return new Promise(() => {
            // Keep the reader pending to mimic a stream that never sends [DONE].
          });
        },
        cancel: async () => {},
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildFragmentedSseResponse(chunk: string): Response {
  const fragmentedEntries = [
    "da",
    `ta: ${JSON.stringify({ type: "token", text: chunk })}\n`,
    "\n",
    "data",
    ": [DONE]",
    "\n\n",
  ].map((entry) => Uint8Array.from(entry.split("").map((char) => char.charCodeAt(0))));

  let readIndex = 0;

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (readIndex < fragmentedEntries.length) {
            const value = fragmentedEntries[readIndex];
            readIndex += 1;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        },
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildFragmentedSseResponseWithoutContentType(chunk: string): Response {
  const fragmentedEntries = [
    "da",
    `ta: ${JSON.stringify({ type: "token", text: chunk })}\n`,
    "\n",
    "data",
    ": [DONE]",
    "\n\n",
  ].map((entry) => Uint8Array.from(entry.split("").map((char) => char.charCodeAt(0))));

  let readIndex = 0;

  return {
    body: {
      getReader: () => ({
        read: async () => {
          if (readIndex < fragmentedEntries.length) {
            const value = fragmentedEntries[readIndex];
            readIndex += 1;
            return { value, done: false };
          }
          return { value: undefined, done: true };
        },
      }),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildEmptyStreamResponse(fallbackText: string): Response {
  return {
    body: {
      getReader: () => ({
        read: async () => ({ value: undefined, done: true }),
      }),
    },
    clone: () => ({
      text: async () => fallbackText,
    }),
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

function buildCloneFallbackSseResponse(): Response {
  const rawSse =
    `data: ${JSON.stringify({ type: "token", text: "Fallback " })}\n\n` +
    `data: ${JSON.stringify({ type: "token", text: "decoded" })}\n\n` +
    "data: [DONE]\n\n";

  return {
    body: {
      getReader: () => ({
        read: async () => ({ value: undefined, done: true }),
      }),
    },
    clone: () => ({
      text: async () => rawSse,
    }),
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === "content-type") {
          return "text/event-stream";
        }
        if (name.toLowerCase() === "x-request-id") {
          return "test-request-id";
        }
        return null;
      },
    },
  } as unknown as Response;
}

describe("UnifiedChat history cap", () => {
  it("never sends more than 30 messages to assistant API", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const historyLengths: number[] = [];
    const assistantMock = asAssistantApiMock(chatApi.assistant);

    assistantMock.mockImplementation(async (...args: unknown[]) => {
      const history = args[0] as ChatMessage[];
      historyLengths.push(history.length);
      return buildStreamResponse("ok");
    });

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");

    for (let i = 0; i < 35; i++) {
      await waitFor(() => {
        const sendButton = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
        expect(sendButton.disabled).toBe(true);
      });

      fireEvent.change(input, { target: { value: `message-${i}` } });
      await waitFor(() => {
        const sendButton = screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
        expect(sendButton.disabled).toBe(false);
      });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(assistantMock.mock.calls.length).toBe(i + 1);
      });
    }

    expect(historyLengths.length).toBe(35);
    expect(Math.max(...historyLengths)).toBeLessThanOrEqual(30);
    expect(historyLengths[historyLengths.length - 1]).toBe(30);
  });

  it("renders buffered streamed text when the live reader yields no chunks", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildEmptyStreamResponse("buffered reply"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("buffered reply")).toBeInTheDocument();
    expect(screen.queryByText(/could not generate a response/i)).not.toBeInTheDocument();
    expect(container.querySelector(".typing-indicator")).toBeNull();
  });

  it("clears typing state on explicit SSE done even when stream stays open", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildSseDoneWithoutNaturalCloseResponse("stream-complete"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("stream-complete")).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector(".typing-indicator")).toBeNull();
    });
  });

  it("clears typing state when only keep-alive frames continue after visible text", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildKeepAliveSseResponseWithoutDone("stable-response"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("stable-response")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(container.querySelector(".typing-indicator")).toBeNull();
      },
      { timeout: 4000 }
    );
  });

  it("clears typing state when only non-visible control token noise continues after visible text", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildInvisibleTailSseResponseWithoutDone("visible-once"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("visible-once")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(container.querySelector(".typing-indicator")).toBeNull();
      },
      { timeout: 4000 }
    );
  });

  it("parses fragmented SSE frames from stream chunks", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildFragmentedSseResponse("fragment-ok"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("fragment-ok")).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector(".typing-indicator")).toBeNull();
    });
  });

  it("parses fragmented SSE frames even when content-type header is missing", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildFragmentedSseResponseWithoutContentType("headerless-ok"));

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    const { container } = render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("headerless-ok")).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector(".typing-indicator")).toBeNull();
    });
  });

  it("normalizes raw SSE fallback text from response clone", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildCloneFallbackSseResponse());

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Fallback decoded")).toBeInTheDocument();
    expect(screen.queryByText(/data:\s*\{/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[DONE\]/i)).not.toBeInTheDocument();
  });

  it("sanitizes raw SSE envelopes at render time", async () => {
    const [{ default: UnifiedChat }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
    ]);

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        {
          role: "assistant",
          content:
            `data: ${JSON.stringify({ type: "token", text: "Rendered text" })}\n\n` +
            "data: [DONE]\n\n",
        },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    render(<AssistantHarness />);

    expect(await screen.findByText("Rendered text")).toBeInTheDocument();
    expect(screen.queryByText(/data:\s*\{/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[DONE\]/i)).not.toBeInTheDocument();
  });

  it("uses Shift+Enter for newline and Enter for send in multiline composer", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const assistantMock = asAssistantApiMock(chatApi.assistant);
    assistantMock.mockResolvedValue(buildStreamResponse("ok"));
    assistantMock.mockClear();

    function AssistantHarness() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "How can I help you?" },
      ]);

      return (
        <UnifiedChat
          chatType="assistant"
          onClose={() => {}}
          messages={messages}
          setMessages={setMessages}
        />
      );
    }

    render(<AssistantHarness />);

    const input = screen.getByLabelText("Chat message input");
    fireEvent.change(input, { target: { value: "line 1" } });

    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(assistantMock).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(assistantMock).toHaveBeenCalledTimes(1);
    });
  });
});
