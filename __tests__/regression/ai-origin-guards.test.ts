import { NextRequest } from "next/server";
import { describe, expect, it } from "@jest/globals";
import { POST as assistancePOST } from "@/app/api/assistance/route";
import { POST as roleplayPOST } from "@/app/api/chat-roleplay/route";

describe("AI route origin guard", () => {
  it("blocks /api/assistance without Origin", async () => {
    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatHistory: [] }),
    });

    const response = await assistancePOST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin header required for this endpoint" });
  });

  it("blocks /api/chat-roleplay without Origin", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "hi", pokemon: "pikachu", chatHistory: [] }),
    });

    const response = await roleplayPOST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin header required for this endpoint" });
  });
});
