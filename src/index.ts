import type { Storage } from "./storage/interface";
import { LocalStorage } from "./storage/local";
import { S3Storage } from "./storage/s3";
import { toKey } from "./key";
import { getCallerFile } from "./caller";

export type { Storage } from "./storage/interface";
export { toKey } from "./key";

export interface I18nConfig {
  locale: string;
  fallback?: string;
  project: string;
  storage?: "local" | "s3";
  localesDir?: string;
}

interface I18nState {
  locale: string;
  fallback: string;
  project: string;
  storage: Storage;
  translations: Record<string, string>;
  fallbackTranslations: Record<string, string>;
}

let state: I18nState | null = null;

export async function init(config: I18nConfig): Promise<void> {
  const { locale, project, storage: storageType = "local", localesDir = "./locales" } = config;
  const fallback = config.fallback ?? "en";

  const storage: Storage =
    storageType === "s3" ? new S3Storage() : new LocalStorage(localesDir);

  const [translations, fallbackTranslations] = await Promise.all([
    storage.read(project, locale),
    locale !== fallback ? storage.read(project, fallback) : Promise.resolve({} as Record<string, string>),
  ]);

  state = { locale, fallback, project, storage, translations, fallbackTranslations };
}

/**
 * Translate a string. File path is detected automatically from the call stack.
 *
 * Usage: t("Welcome to the app")
 *        t("Hello {{name}}", { name: "Alice" })
 */
export function t(text: string, params?: Record<string, string>): string {
  if (!state) throw new Error("i18n not initialized — call init() first");

  const filePath = getCallerFile();
  const key = toKey(filePath, text);
  const raw =
    state.translations[key] ??
    (state.locale !== state.fallback ? state.fallbackTranslations[key] : undefined) ??
    text;

  if (!params) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`);
}

export function getState(): Readonly<I18nState> | null {
  return state;
}
