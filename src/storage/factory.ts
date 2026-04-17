import type { ResolvedI18nConfig } from "../config";
import { LocalStorage } from "./local";
import { HttpStorage } from "./http";
import type { Storage } from "./types";

export function createStorage(config: ResolvedI18nConfig): Storage {
  if (config.storageAdapter) return config.storageAdapter;
  if (config.storage === "s3") return new HttpStorage();
  return new LocalStorage(config.localesDir);
}
