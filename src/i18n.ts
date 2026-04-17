import { resolveConfig, type I18nConfig, type ResolvedI18nConfig } from "./config";
import { getCallerFile } from "./core/caller";
import { interpolate } from "./core/interpolate";
import { toKey } from "./core/key";
import { I18nNotInitializedError } from "./errors";
import { createStorage } from "./storage/factory";
import type { Storage, TranslationMap } from "./storage/types";

/**
 * I18n instance — load translations once, then call `t()` to translate.
 *
 * Usually consumers use the singleton `init()`/`t()` exports from index.ts;
 * the class is exposed for tests and apps that need multiple isolated instances
 * (multi-tenant servers, plugin sandboxes, etc.).
 */
export class I18n {
  private translations: TranslationMap = {};

  private constructor(
    private readonly config: ResolvedI18nConfig,
    private readonly storage: Storage,
  ) {}

  /** Build, load translations, and return a ready-to-use instance. */
  static async create(config: I18nConfig): Promise<I18n> {
    const resolved = resolveConfig(config);
    const storage = createStorage(resolved);
    const instance = new I18n(resolved, storage);
    await instance.load();
    return instance;
  }

  private async load(): Promise<void> {
    const { project, locale, logger } = this.config;
    logger.debug("Loading translations", { project, locale });

    try {
      this.translations = await this.storage.read(project, locale);
      logger.info("Translations loaded", {
        locale,
        primaryKeys: Object.keys(this.translations).length,
      });
    } catch (err) {
      logger.warn("Failed to load translations, using source text as fallback", {
        error: (err as Error).message,
      });
    }
  }

  /**
   * Translate a string. Caller's file is auto-detected via stack trace and
   * combined with the source string to form the lookup key.
   *
   * @param text         Original string (English by convention).
   * @param params       Optional `{{param}}` substitutions.
   * @param callerFile   Override caller detection — used when wrapping `t()`.
   */
  t(text: string, params?: Record<string, string | number>, callerFile?: string): string {
    const file = callerFile ?? getCallerFile(1);
    const key = toKey(file, text);
    const raw = this.translations[key] ?? text;

    return interpolate(raw, params);
  }

  /** Read-only view of the resolved config — handy for diagnostics. */
  getConfig(): Readonly<ResolvedI18nConfig> {
    return this.config;
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton (the ergonomic default API).
// ---------------------------------------------------------------------------

let instance: I18n | null = null;

export async function init(config: I18nConfig): Promise<I18n> {
  instance = await I18n.create(config);
  return instance;
}

export function t(text: string, params?: Record<string, string | number>): string {
  if (!instance) throw new I18nNotInitializedError();
  // We're one frame above where I18n.t would normally introspect, so capture
  // the caller here and pass it through explicitly.
  const callerFile = getCallerFile(1);
  return instance.t(text, params, callerFile);
}

export function getInstance(): I18n | null {
  return instance;
}

/** Test/teardown helper — clears the singleton. */
export function reset(): void {
  instance = null;
}
