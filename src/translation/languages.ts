/**
 * Map BCP-47 locale codes to human-readable language names for prompting LLMs.
 * Falls back to the raw locale code if unmapped — most providers handle that.
 */
const LOCALE_TO_LANGUAGE: Record<string, string> = {
  ar: "Arabic",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  en: "English",
  es: "Spanish",
  fi: "Finnish",
  fr: "French",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  zh: "Chinese (Simplified)",
};

export function languageName(locale: string): string {
  const base = locale.split("-")[0]?.toLowerCase() ?? locale;
  return LOCALE_TO_LANGUAGE[base] ?? locale;
}
