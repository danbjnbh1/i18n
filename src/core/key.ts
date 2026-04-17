import { KEY_TEXT_SLUG_MAX_LEN } from "../constants";

/**
 * Build a deterministic translation key from a source file path + original string.
 *
 * Same logic runs at runtime (in `t()`) and at extraction time (in the CLI),
 * so keys round-trip exactly. Changing this function is a breaking change for
 * existing translation files.
 *
 * @example
 *   toKey("src/pages/home.tsx", "Welcome to the app")
 *   // => "pages_home:welcome_to_the_app"
 */
export function toKey(filePath: string, text: string): string {
  const fileSlug = filePath
    .replace(/\\/g, "/")
    .replace(/^.*\/src\//, "")
    .replace(/^src\//, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/\//g, "_")
    .toLowerCase();

  const textSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, KEY_TEXT_SLUG_MAX_LEN);

  return `${fileSlug}:${textSlug}`;
}
