#!/usr/bin/env ts-node
/**
 * Usage: ts-node src/translator.ts <src-dir> <locale1> <locale2> ...
 * Example: ts-node src/translator.ts ./src fr es ja
 *
 * Env vars required:
 *   GEMINI_API_KEY
 *   I18N_PROJECT   — project name (used for localesDir subfolder)
 *   LOCALES_DIR    — optional, default: ./locales
 */

import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toKey } from "./key";
import { LocalStorage } from "./storage/local";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROJECT = process.env.I18N_PROJECT ?? "app";
const LOCALES_DIR = process.env.LOCALES_DIR ?? "./locales";
const RATE_LIMIT_DELAY_MS = 200;

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

function scanFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Key extraction
// ---------------------------------------------------------------------------

// Matches: t("...") or t('...')  — single-line strings only
const T_CALL_RE = /\bt\(\s*(['"`])((?:(?!\1).)*)\1/g;

function extractKeys(srcDir: string): Map<string, string> {
  const files = scanFiles(srcDir);
  const keys = new Map<string, string>(); // key -> original text

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    // Normalize to relative path from srcDir for consistent key generation
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    let match: RegExpExecArray | null;
    T_CALL_RE.lastIndex = 0;
    while ((match = T_CALL_RE.exec(content)) !== null) {
      const text = match[2];
      if (!text.trim()) continue;
      const key = toKey(relPath, text);
      keys.set(key, text);
    }
  }

  return keys;
}

// ---------------------------------------------------------------------------
// Sorting helper
// ---------------------------------------------------------------------------

function sortedObject(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

// ---------------------------------------------------------------------------
// Gemini translation
// ---------------------------------------------------------------------------

async function translateText(genAI: GoogleGenerativeAI, text: string, targetLocale: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const languageNames: Record<string, string> = {
    fr: "French",
    es: "Spanish",
    de: "German",
    ja: "Japanese",
    zh: "Chinese (Simplified)",
    ko: "Korean",
    pt: "Portuguese",
    it: "Italian",
    ru: "Russian",
    ar: "Arabic",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    sv: "Swedish",
  };
  const language = languageNames[targetLocale] ?? targetLocale;

  const prompt = `Translate the following UI string to ${language}. Return only the translated string, no explanations, no quotes.\n\n${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: ts-node src/translator.ts <src-dir> <locale1> <locale2> ...");
    process.exit(1);
  }

  const [srcDir, ...targetLocales] = args;

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY env var required");
    process.exit(1);
  }

  const storage = new LocalStorage(LOCALES_DIR);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // Step 1: extract all t() calls
  console.log(`Scanning ${srcDir}...`);
  const extracted = extractKeys(srcDir);
  console.log(`Found ${extracted.size} unique keys`);

  // Step 2: update en.json (source of truth)
  const existing = await storage.read(PROJECT, "en");
  const updated: Record<string, string> = { ...existing };
  for (const [key, text] of extracted) {
    updated[key] = text; // always overwrite with current source string
  }
  await storage.write(PROJECT, "en", sortedObject(updated));
  console.log(`Updated en.json (${Object.keys(updated).length} keys)`);

  // Step 3: translate missing keys for each target locale
  for (const locale of targetLocales) {
    console.log(`\nProcessing locale: ${locale}`);
    const localeData = await storage.read(PROJECT, locale);
    let newCount = 0;

    for (const [key, text] of Object.entries(updated)) {
      if (localeData[key]) continue; // already translated

      process.stdout.write(`  Translating "${text.slice(0, 40)}"... `);
      try {
        const translated = await translateText(genAI, text, locale);
        localeData[key] = translated;
        newCount++;
        console.log(`done`);
      } catch (err) {
        console.error(`ERROR: ${(err as Error).message}`);
      }

      await sleep(RATE_LIMIT_DELAY_MS);
    }

    await storage.write(PROJECT, locale, sortedObject(localeData));
    console.log(`  Saved ${locale}.json (+${newCount} new translations)`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
