import fs from "node:fs/promises";
import path from "node:path";
import { toKey } from "../core/key";

/** Matches `t("...")`, `t('...')`, `` t(`...`) `` — single-line strings only. */
const T_CALL_RE = /\bt\(\s*(['"`])((?:(?!\1).)*)\1/g;

export interface ExtractedKey {
  key: string;
  text: string;
  file: string;
}

/**
 * Scan a list of source files and pull out every `t("…")` call.
 * Returns one `ExtractedKey` per unique key (last occurrence wins on text).
 */
export async function extractKeysFromFiles(files: string[]): Promise<Map<string, ExtractedKey>> {
  const keys = new Map<string, ExtractedKey>();

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf-8");
      const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");

      T_CALL_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = T_CALL_RE.exec(content)) !== null) {
        const text = match[2];
        if (!text || !text.trim()) continue;
        const key = toKey(relPath, text);
        keys.set(key, { key, text, file: relPath });
      }
    }),
  );

  return keys;
}
