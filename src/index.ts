/**
 * Public API.
 *
 * Most consumers want:
 *   import { init, t } from "@danbjnbh1/i18n";
 *
 * Advanced consumers (multi-instance, custom providers, custom storage) can
 * reach for the named class/interface exports below.
 */

export { I18n, init, t, getInstance, reset } from "./i18n";

export type { I18nConfig, ResolvedI18nConfig, StorageType } from "./config";

export {
  type Storage,
  type TranslationMap,
  LocalStorage,
  S3Storage,
  type S3StorageOptions,
  MemoryStorage,
  createStorage,
} from "./storage";

export {
  type TranslationProvider,
  GeminiProvider,
  type GeminiProviderOptions,
  languageName,
} from "./translation";

export { type Logger, type LogLevel, ConsoleLogger, SilentLogger } from "./logger";

export {
  I18nError,
  I18nNotInitializedError,
  I18nConfigError,
  StorageError,
  TranslationError,
} from "./errors";

export { toKey } from "./core/key";
export { interpolate } from "./core/interpolate";
