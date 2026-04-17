/**
 * Translation provider contract. Implement this to swap Gemini for OpenAI,
 * DeepL, Anthropic, or an in-house service without touching the CLI.
 */
export interface TranslationProvider {
  /**
   * Translate a single string into the target locale.
   * @param text          Source UI string (English by convention).
   * @param targetLocale  BCP-47 locale code (e.g. "fr", "es", "ja").
   */
  translate(text: string, targetLocale: string): Promise<string>;
}
