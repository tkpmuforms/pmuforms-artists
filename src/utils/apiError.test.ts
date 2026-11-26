import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./apiError";

describe("getApiErrorMessage", () => {
  it("reads the body axiosSetup rejects with", () => {
    expect(
      getApiErrorMessage(
        { statusCode: 400, error: "Bad Request", message: "Client already exists" },
        "x",
      ),
    ).toBe("Client already exists");
  });

  it("reads an axios error too", () => {
    expect(
      getApiErrorMessage({ response: { data: { message: "Nope" } } }, "x"),
    ).toBe("Nope");
  });

  it("joins validation messages", () => {
    expect(getApiErrorMessage({ message: ["a", "", "b"] }, "x")).toBe("a, b");
  });

  it("falls back when there's nothing to show", () => {
    expect(getApiErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ message: "  " }, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ message: [] }, "fallback")).toBe("fallback");
  });
});
