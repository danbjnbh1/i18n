import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_GEMINI_MODEL } from "../constants";
import { I18nConfigError, TranslationError } from "../errors";
import { languageName } from "./languages";
import type { TranslationProvider } from "./types";

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
}

export class GeminiProvider implements TranslationProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) throw new I18nConfigError("Gemini apiKey is required");
    this.client = new GoogleGenerativeAI(options.apiKey);
    this.modelName = options.model ?? DEFAULT_GEMINI_MODEL;
  }

  static fromEnv(): GeminiProvider {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new I18nConfigError("GEMINI_API_KEY env var required");
    return new GeminiProvider({ apiKey });
  }

  async translate(text: string, targetLocale: string): Promise<string> {
    const language = languageName(targetLocale);
    const prompt = [
      `Act as a professional UI localization expert. Translate the provided string into [Language].

        ### RULES:
        1. **Output Format:** Return ONLY the translated text. No quotes, no explanations, no "Translation:" prefix.
        2. **Placeholders:** Keep placeholders like {{name}}, {{count}}, or {{value}} exactly as they are. You may move their position within the sentence to maintain natural grammar, but do not translate the text inside the braces.
        3. **RTL Logic (CRITICAL):** For RTL languages like Hebrew or Arabic, provide the string in LOGICAL ORDER (the order characters are stored in memory). Do not attempt to "visually" flip the string or the placeholders. The software's rendering engine will handle the visual display.
        4. **Tone:** Use a professional, user-friendly UI tone appropriate for buttons, labels, and notifications.

        ### INPUT:
        String: ${text}"
        Language: ${language}`,
    ].join("\n");

    console.debug(`Gemini prompt for locale "${targetLocale}":\n${prompt}`);

    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error(`Gemini translation error for locale "${targetLocale}":`, err);
      throw new TranslationError(`Gemini translation failed for locale "${targetLocale}"`, err);
    }
  }
}
