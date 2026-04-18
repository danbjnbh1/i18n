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

  async translateBatch(texts: string[], targetLocale: string): Promise<string[]> {
    const language = languageName(targetLocale);
    const input: Record<string, string> = {};
    texts.forEach((t, i) => {
      input[String(i)] = t;
    });

    const prompt = `You are a professional UI localization engine. Translate the following JSON object values into ${language}.

RULES (follow exactly):
- Return ONLY a valid JSON object. No markdown, no code fences, no explanation.
- Preserve every key exactly as-is.
- Preserve placeholders like {{name}}, {{count}}, {{value}} unchanged.
- For RTL languages (Hebrew, Arabic, etc.) output strings in logical order — do not visually flip.
- Use a professional, concise UI tone suitable for buttons, labels, and notifications.
- Every key from the input MUST appear in the output with a non-empty string value.

INPUT:
${JSON.stringify(input, null, 2)}`;

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new TranslationError(
          `Gemini returned non-JSON response for locale "${targetLocale}": ${raw.slice(0, 120)}`,
        );
      }

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new TranslationError(
          `Gemini response is not a JSON object for locale "${targetLocale}"`,
        );
      }

      const output = parsed as Record<string, unknown>;
      const translations = texts.map((_, i) => {
        const value = output[String(i)];
        if (typeof value !== "string" || !value.trim()) {
          throw new TranslationError(
            `Gemini missing or empty translation for index ${i} (locale "${targetLocale}")`,
          );
        }
        return value;
      });

      return translations;
    } catch (err) {
      if (err instanceof TranslationError) throw err;
      throw new TranslationError(
        `Gemini batch translation failed for locale "${targetLocale}"`,
        err,
      );
    }
  }
}
