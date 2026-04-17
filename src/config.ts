import { DEFAULT_FALLBACK_LOCALE, DEFAULT_LOCALES_DIR } from "./constants";
import { I18nConfigError } from "./errors";
import { ConsoleLogger, type Logger } from "./logger";
import type { Storage } from "./storage/types";

export type StorageType = "local" | "s3";

/**
 * Public-facing config accepted by `init()`. All optional fields fall back to
 * sensible defaults documented in `constants.ts`.
 */
export interface I18nConfig {
  locale: string;
  project: string;
  fallback?: string;
  storage?: StorageType;
  localesDir?: string;
  /** Inject a custom storage implementation, bypasses `storage`/`localesDir`. */
  storageAdapter?: Storage;
  logger?: Logger;
}

/** Fully-resolved config used internally — no optional fields. */
export interface ResolvedI18nConfig {
  locale: string;
  project: string;
  fallback: string;
  storage: StorageType;
  localesDir: string;
  storageAdapter?: Storage;
  logger: Logger;
}

export function resolveConfig(config: I18nConfig): ResolvedI18nConfig {
  if (!config.locale) throw new I18nConfigError("`locale` is required");
  if (!config.project) throw new I18nConfigError("`project` is required");

  return {
    locale: config.locale,
    project: config.project,
    fallback: config.fallback ?? DEFAULT_FALLBACK_LOCALE,
    storage: config.storage ?? "local",
    localesDir: config.localesDir ?? DEFAULT_LOCALES_DIR,
    storageAdapter: config.storageAdapter,
    logger: config.logger ?? new ConsoleLogger("warn"),
  };
}
