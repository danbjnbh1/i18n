import fs from "node:fs/promises";
import path from "node:path";
import { StorageError } from "../errors";
import type { Storage, TranslationMap } from "./types";

/**
 * Filesystem-backed storage. Files live at `{baseDir}/{project}/{locale}.json`.
 * Writes are atomic via tmpfile + rename to avoid partial-write corruption.
 */
export class LocalStorage implements Storage {
  constructor(private readonly baseDir: string) {}

  private filePath(project: string, locale: string): string {
    return path.join(this.baseDir, project, `${locale}.json`);
  }

  async read(project: string, locale: string): Promise<TranslationMap> {
    const fp = this.filePath(project, locale);
    try {
      const raw = await fs.readFile(fp, "utf-8");
      return JSON.parse(raw) as TranslationMap;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw new StorageError(`Failed to read ${fp}`, err);
    }
  }

  async write(project: string, locale: string, data: TranslationMap): Promise<void> {
    const fp = this.filePath(project, locale);
    const dir = path.dirname(fp);
    const tmp = `${fp}.${process.pid}.tmp`;
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf-8");
      await fs.rename(tmp, fp);
    } catch (err) {
      throw new StorageError(`Failed to write ${fp}`, err);
    }
  }
}
