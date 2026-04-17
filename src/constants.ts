/**
 * Shared constants. Centralized so tuning is one-stop.
 */

export const DEFAULT_FALLBACK_LOCALE = "en";
export const DEFAULT_LOCALES_DIR = "./locales";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
export const DEFAULT_RATE_LIMIT_MS = 200;

/** Max characters retained from the source string when building a key slug. */
export const KEY_TEXT_SLUG_MAX_LEN = 30;

/** File extensions scanned by the CLI extractor. */
export const SCANNED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const;
