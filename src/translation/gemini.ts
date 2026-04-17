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
    const prompt = `Translate the following UI string to ${language}. Return only the translated string, no explanations, no quotes.\n\n${text}`;

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
