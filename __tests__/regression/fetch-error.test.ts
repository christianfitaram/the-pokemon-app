import { describe, expect, it } from "@jest/globals";
import { FetchError } from "@/lib/error_handling/FetchError";

describe("FetchError", () => {
  it("stores status, message, and class name", () => {
    const error = new FetchError(429, "Rate limited");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FetchError);
    expect(error.name).toBe("FetchError");
    expect(error.status).toBe(429);
    expect(error.message).toBe("Rate limited");
  });
});
