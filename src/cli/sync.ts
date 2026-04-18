import { DEFAULT_BATCH_SIZE, DEFAULT_RATE_LIMIT_MS } from "../constants";
import type { Logger } from "../logger";
import type { Storage, TranslationMap } from "../storage/types";
import type { TranslationProvider } from "../translation/types";
import { extractKeysFromFiles } from "./extractor";
import { scanFiles } from "./scanner";

export interface SyncOptions {
  srcDir: string;
  project: string;
  sourceLocale: string;
  targetLocales: string[];
  storage: Storage;
  provider: TranslationProvider;
  logger: Logger;
  /** Delay between provider calls — keeps free-tier rate limits happy. */
  rateLimitMs?: number;
}

export interface SyncResult {
  totalKeys: number;
  perLocale: Record<string, { added: number; failed: number }>;
}

/**
 * End-to-end translation sync:
 *   1. scan source dir
 *   2. extract t() keys
 *   3. update source-of-truth file (e.g. en.json)
 *   4. for each target locale, translate missing keys and write back
 */
export async function syncTranslations(opts: SyncOptions): Promise<SyncResult> {
  const {
    srcDir,
    project,
    sourceLocale,
    targetLocales,
    storage,
    provider,
    logger,
    rateLimitMs = DEFAULT_RATE_LIMIT_MS,
  } = opts;

  logger.info(`Scanning ${srcDir}`);
  const files = await scanFiles(srcDir);
  logger.info(`Found ${files.length} source files`);

  const extracted = await extractKeysFromFiles(files);
  logger.info(`Extracted ${extracted.size} unique keys`);

  // 1. Update source-of-truth file with current strings.
  const sourceExisting = await storage.read(project, sourceLocale);
  const sourceUpdated: TranslationMap = { ...sourceExisting };
  for (const { key, text } of extracted.values()) {
    sourceUpdated[key] = text; // overwrite — source string is authoritative
  }
  await storage.write(project, sourceLocale, sortMap(sourceUpdated));
  logger.info(`Updated ${sourceLocale}.json (${Object.keys(sourceUpdated).length} keys)`);

  // 2. Translate missing keys per target locale.
  const perLocale: SyncResult["perLocale"] = {};
  for (const locale of targetLocales) {
    perLocale[locale] = await syncLocale({
      locale,
      project,
      sourceMap: sourceUpdated,
      storage,
      provider,
      logger,
      rateLimitMs,
    });
  }

  return { totalKeys: extracted.size, perLocale };
}

async function syncLocale(args: {
  locale: string;
  project: string;
  sourceMap: TranslationMap;
  storage: Storage;
  provider: TranslationProvider;
  logger: Logger;
  rateLimitMs: number;
}): Promise<{ added: number; failed: number }> {
  const { locale, project, sourceMap, storage, provider, logger, rateLimitMs } = args;
  logger.info(`Processing locale: ${locale}`);

  const localeData = await storage.read(project, locale);

  const missing = Object.entries(sourceMap).filter(([key]) => !localeData[key]);
  let added = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i += DEFAULT_BATCH_SIZE) {
    const chunk = missing.slice(i, i + DEFAULT_BATCH_SIZE);
    const keys = chunk.map(([key]) => key);
    const texts = chunk.map(([, text]) => text);

    try {
      const translated = await provider.translateBatch(texts, locale);
      for (let j = 0; j < keys.length; j++) {
        localeData[keys[j]!] = translated[j]!;
        logger.debug(`  ${keys[j]} → ${truncate(translated[j]!, 60)}`);
      }
      added += keys.length;
    } catch (err) {
      failed += keys.length;
      logger.error(`  Batch failed (${keys.length} strings)`, {
        error: (err as Error).message,
      });
    }

    if (rateLimitMs > 0 && i + DEFAULT_BATCH_SIZE < missing.length) await sleep(rateLimitMs);
  }

  await storage.write(project, locale, sortMap(localeData));
  logger.info(`  Saved ${locale}.json (+${added} added, ${failed} failed)`);

  return { added, failed };
}

function sortMap(map: TranslationMap): TranslationMap {
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
