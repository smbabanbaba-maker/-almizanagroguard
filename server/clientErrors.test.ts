import { describe, expect, it } from "vitest";
import { humanizeClientError } from "../client/src/lib/clientErrors";

describe("farmer-safe client error messages", () => {
  it("hides a non-JSON server response from Crop Health users", () => {
    const fallback =
      "We couldn't analyze this image. Please try again with a clear crop photo.";
    const parserError = new Error(
      "Unexpected token 'A', \"A server error\" is not valid JSON"
    );

    expect(humanizeClientError(parserError, fallback)).toBe(fallback);
  });

  it("keeps short-question guidance actionable", () => {
    const issue = new Error(
      JSON.stringify([
        {
          code: "too_small",
          path: ["question"],
          message: "String must contain at least 2 character(s)",
        },
      ])
    );

    expect(humanizeClientError(issue, "Fallback")).toBe(
      "Please type a short agricultural question first."
    );
  });
});
