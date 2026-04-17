export type { Storage, TranslationMap } from "./types";
export { LocalStorage } from "./local";
export { S3Storage, type S3StorageOptions } from "./s3";
export { createStorage } from "./factory";
