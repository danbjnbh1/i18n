import { describe, expect, it } from "vitest";
import { interpolate } from "../src/core/interpolate";

describe("interpolate", () => {
  it("returns template unchanged when params are absent", () => {
    expect(interpolate("Hello {{name}}")).toBe("Hello {{name}}");
  });

  it("substitutes single placeholder", () => {
    expect(interpolate("Hello {{name}}", { name: "Alice" })).toBe("Hello Alice");
  });

  it("substitutes multiple placeholders", () => {
    expect(interpolate("{{greeting}}, {{name}}", { greeting: "Hi", name: "Bob" })).toBe("Hi, Bob");
  });

  it("coerces numbers to strings", () => {
    expect(interpolate("Count: {{n}}", { n: 42 })).toBe("Count: 42");
  });

  it("leaves missing params as visible placeholders", () => {
    expect(interpolate("Hi {{name}}", {})).toBe("Hi {{name}}");
  });
});
