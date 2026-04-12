/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { usePagination } from "@/hooks/usePagination";

describe("usePagination regression checks", () => {
  it("computes pages from provided count without network calls", () => {
    const hadFetch = typeof global.fetch === "function";
    if (!hadFetch) {
      // jsdom in Jest can omit fetch depending on runtime setup.
      (global as typeof globalThis & { fetch: typeof fetch }).fetch = jest.fn() as unknown as typeof fetch;
    }
    const fetchSpy = jest.spyOn(global, "fetch");

    const { result } = renderHook(() => usePagination(1302, 24));

    expect(result.current.totalPages).toBe(55);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    if (!hadFetch) {
      delete (global as Partial<typeof globalThis>).fetch;
    }
  });
});
