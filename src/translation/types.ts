export interface TranslationProvider {
  translateBatch(texts: string[], targetLocale: string): Promise<string[]>;
}
