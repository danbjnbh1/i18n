import { I18nConfigError } from "./errors";
import { ConsoleLogger, type Logger } from "./logger";
import type { TranslationMap } from "./storage/types";

/**
 * Public-facing config accepted by `init()`. All optional fields fall back to
 * sensible defaults documented in `constants.ts`.
 */
export interface I18nConfig {
  locale: string;
  project: string;
  /**
   * Pre-loaded translations keyed by locale. Typically the default export of
   * a generated `locales/index.ts` file. When provided, no network access
   * happens at runtime. Otherwise translations are fetched over HTTP.
   */
  locales?: Record<string, TranslationMap>;
  logger?: Logger;
}

/** Fully-resolved config used internally — no optional fields. */
export interface ResolvedI18nConfig {
  locale: string;
  project: string;
  locales?: Record<string, TranslationMap>;
  logger: Logger;
}

export function resolveConfig(config: I18nConfig): ResolvedI18nConfig {
  if (!config.locale) throw new I18nConfigError("`locale` is required");
  if (!config.project) throw new I18nConfigError("`project` is required");

  return {
    locale: config.locale,
    project: config.project,
    locales: config.locales,
    logger: config.logger ?? new ConsoleLogger("warn"),
  };
}
