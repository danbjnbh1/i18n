import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorage } from "../src/storage/local";

describe("LocalStorage", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "i18n-test-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns empty object for missing file", async () => {
    const storage = new LocalStorage(dir);
    expect(await storage.read("proj", "fr")).toEqual({});
  });

  it("round-trips data through write + read", async () => {
    const storage = new LocalStorage(dir);
    await storage.write("proj", "fr", { greeting: "Bonjour" });
    expect(await storage.read("proj", "fr")).toEqual({ greeting: "Bonjour" });
  });

  it("creates nested project directory automatically", async () => {
    const storage = new LocalStorage(dir);
    await storage.write("nested-proj", "es", { hi: "Hola" });
    const filePath = path.join(dir, "nested-proj", "es.json");
    const stat = await fs.stat(filePath);
    expect(stat.isFile()).toBe(true);
  });
});
