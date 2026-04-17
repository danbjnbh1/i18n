/** Translation document shape: flat map of key → translated string. */
export type TranslationMap = Record<string, string>;

/**
 * Storage adapter contract. Implementations must be safe to call concurrently
 * for different (project, locale) pairs. `read` returns `{}` for a missing
 * document — never throws on absence.
 */
export interface Storage {
  read(project: string, locale: string): Promise<TranslationMap>;
  write(project: string, locale: string, data: TranslationMap): Promise<void>;
}
