/**
 * Derive a deterministic i18n key from a source file path + original string.
 *
 * File slug: strip leading "src/", remove extension, replace "/" with "_", lowercase.
 * Text slug: lowercase, keep only [a-z0-9_], collapse whitespace to "_", max 30 chars.
 * Format: `{file_slug}:{text_slug}`
 */
export function toKey(filePath: string, text: string): string {
  const fileSlug = filePath
    .replace(/^src\//, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/\//g, "_")
    .toLowerCase();

  const textSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return `${fileSlug}:${textSlug}`;
}
