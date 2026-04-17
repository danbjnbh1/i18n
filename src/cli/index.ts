#!/usr/bin/env node
/**
 * CLI entry — `i18n-translate <src-dir> <locale1> [locale2] ...`
 *
 * Env vars:
 *   GEMINI_API_KEY         — required
 *   I18N_PROJECT           — project name (default "app")
 *   I18N_SOURCE_LOCALE     — source-of-truth locale (default "en")
 *   I18N_STORAGE           — "local" | "s3" (default "local")
 *   LOCALES_DIR            — local storage dir (default "./locales")
 *   I18N_RATE_LIMIT_MS     — delay between translation calls (default 200)
 *   LOG_LEVEL              — debug | info | warn | error (default "info")
 *   S3_BUCKET, S3_ENDPOINT, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */

import { ConsoleLogger, type LogLevel } from "../logger";
import { LocalStorage } from "../storage/local";
import { S3Storage } from "../storage/s3";
import type { Storage } from "../storage/types";
import { GeminiProvider } from "../translation/gemini";
import { syncTranslations } from "./sync";

function getStorage(logger: ConsoleLogger): Storage {
  const type = process.env.I18N_STORAGE ?? "local";
  if (type === "s3") {
    logger.info("Using S3 storage");
    return S3Storage.fromEnv();
  }
  const dir = process.env.LOCALES_DIR ?? "./locales";
  logger.info(`Using local storage at ${dir}`);
  return new LocalStorage(dir);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: i18n-translate <src-dir> <locale1> [locale2] ...");
    process.exit(1);
  }

  const [srcDir, ...targetLocales] = args;
  if (!srcDir) {
    console.error("src-dir is required");
    process.exit(1);
  }

  const logLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  const logger = new ConsoleLogger(logLevel);

  const project = process.env.I18N_PROJECT ?? "app";
  const sourceLocale = process.env.I18N_SOURCE_LOCALE ?? "en";
  const rateLimitMs = Number(process.env.I18N_RATE_LIMIT_MS ?? 200);

  const storage = getStorage(logger);
  const provider = GeminiProvider.fromEnv();

  const result = await syncTranslations({
    srcDir,
    project,
    sourceLocale,
    targetLocales,
    storage,
    provider,
    logger,
    rateLimitMs,
  });

  logger.info("Done", { totalKeys: result.totalKeys, perLocale: result.perLocale });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
