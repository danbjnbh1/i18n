import fs from "node:fs/promises";
import path from "node:path";
import { SCANNED_EXTENSIONS } from "../constants";

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);

/**
 * Recursively list source files under `dir` matching `SCANNED_EXTENSIONS`.
 * Skips common build/vendor directories to avoid scanning compiled output.
 */
export async function scanFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  await walk(dir, out);
  return out;
}

async function walk(dir: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".") && entry.name !== ".") return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) return;
        await walk(full, out);
      } else if (isScannable(entry.name)) {
        out.push(full);
      }
    }),
  );
}

function isScannable(filename: string): boolean {
  const ext = path.extname(filename);
  return (SCANNED_EXTENSIONS as readonly string[]).includes(ext);
}
