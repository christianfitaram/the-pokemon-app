import { NextRequest } from "next/server";
import { describe, expect, it, jest } from "@jest/globals";
import { middleware } from "@/middleware";

describe("middleware costly-route origin checks", () => {
  it("rejects costly routes without an Origin header", async () => {
    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
    });

    const response = await middleware(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Origin header required for this endpoint" });
  });

  it("allows non-costly API routes without an Origin header", async () => {
    const request = new NextRequest("http://localhost:3000/api/pokemons/first-page", {
      method: "GET",
    });

    const response = await middleware(request);

    expect(response.status).not.toBe(403);
  });

  it("does not call internal rate-limit fetch during middleware execution", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
    });

    await middleware(request);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
