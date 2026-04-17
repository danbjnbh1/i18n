import type { Storage, TranslationMap } from "./types";

/**
 * In-memory storage backed by pre-loaded translation maps.
 * Use this in browser environments where the filesystem is unavailable.
 *
 * @example
 *   import he from "../locales/my-app/he.json";
 *   import en from "../locales/my-app/en.json";
 *
 *   const storage = new MemoryStorage({ "my-app": { he, en } });
 *   await init({ locale: "he", project: "my-app", storageAdapter: storage });
 */
export class MemoryStorage implements Storage {
  private readonly data: Record<string, Record<string, TranslationMap>>;

  constructor(data: Record<string, Record<string, TranslationMap>>) {
    this.data = data;
  }

  async read(project: string, locale: string): Promise<TranslationMap> {
    return this.data[project]?.[locale] ?? {};
  }

  async write(): Promise<void> {
    // no-op — translations are pre-loaded, not written at runtime
  }
}
