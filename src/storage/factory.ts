import type { ResolvedI18nConfig } from "../config";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { Storage } from "./types";

/**
 * Build a Storage instance from resolved config. If `storageAdapter` is set,
 * it wins — used for tests and DI.
 */
export function createStorage(config: ResolvedI18nConfig): Storage {
  if (config.storageAdapter) return config.storageAdapter;
  if (config.storage === "s3") return S3Storage.fromEnv();
  return new LocalStorage(config.localesDir);
}
