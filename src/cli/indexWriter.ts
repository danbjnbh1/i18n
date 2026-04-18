import fs from "node:fs/promises";
import path from "node:path";

/**
 * Generate `{dir}/index.ts` that imports every locale JSON in the folder and
 * exports them as `{ [locale]: TranslationMap }`. Consumers pass the default
 * export to `init({ locales })` — no runtime fs or network needed.
 */
export async function writeLocalesIndex(dir: string): Promise<string> {
  const entries = await fs.readdir(dir);
  const locales = entries
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .sort();

  const lines: string[] = [];
  for (const locale of locales) {
    lines.push(`import ${safeIdent(locale)} from "./${locale}.json";`);
  }
  lines.push("");
  lines.push(`export default {`);
  for (const locale of locales) {
    lines.push(`  ${JSON.stringify(locale)}: ${safeIdent(locale)},`);
  }
  lines.push(`};`);
  lines.push("");

  const filePath = path.join(dir, "index.ts");
  await fs.writeFile(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

function safeIdent(locale: string): string {
  return `_${locale.replace(/[^a-zA-Z0-9_$]/g, "_")}`;
}
