import { describe, expect, it } from "vitest";
import { toKey } from "../src/core/key";

describe("toKey", () => {
  it("strips src/ prefix and extension, joins path with underscores", () => {
    expect(toKey("src/pages/home.tsx", "Welcome")).toBe("pages_home:welcome");
  });

  it("handles absolute paths containing src/", () => {
    expect(toKey("/Users/x/proj/src/components/Button.tsx", "Click")).toBe(
      "components_button:click",
    );
  });

  it("normalizes Windows path separators", () => {
    expect(toKey("src\\pages\\home.tsx", "Hi")).toBe("pages_home:hi");
  });

  it("collapses non-alphanumeric runs in text to single underscores", () => {
    expect(toKey("src/a.ts", "Hello, World!")).toBe("a:hello_world");
  });

  it("truncates long text slugs to 30 chars", () => {
    const text = "a".repeat(100);
    const key = toKey("src/a.ts", text);
    expect(key.split(":")[1]?.length).toBe(30);
  });

  it("trims leading/trailing underscores from text slug", () => {
    expect(toKey("src/a.ts", "...hello...")).toBe("a:hello");
  });
});
