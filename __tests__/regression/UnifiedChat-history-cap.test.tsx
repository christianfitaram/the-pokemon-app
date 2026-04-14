/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";
import type { ChatMessage } from "@/types/interfaces";
import type { ImgHTMLAttributes, ReactNode } from "react";

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
  const value = Uint8Array.from(chunk.split("").map((char) => char.charCodeAt(0)));

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
  } as unknown as Response;
}

describe("UnifiedChat history cap", () => {
  it("never sends more than 30 messages to assistant API", async () => {
    const [{ default: UnifiedChat }, { chatApi }] = await Promise.all([
      import("@/components/chat/UnifiedChat"),
      import("@/lib/api_clients/pokemonApiClient"),
    ]);

    const historyLengths: number[] = [];
    const assistantMock = chatApi.assistant as jest.Mock;

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
        expect(sendButton.disabled).toBe(false);
      });

      fireEvent.change(input, { target: { value: `message-${i}` } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(assistantMock.mock.calls.length).toBe(i + 1);
      });
    }

    expect(historyLengths.length).toBe(35);
    expect(Math.max(...historyLengths)).toBeLessThanOrEqual(30);
    expect(historyLengths[historyLengths.length - 1]).toBe(30);
  });
});
