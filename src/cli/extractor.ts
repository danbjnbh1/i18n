import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { toKey } from "../core/key";

export interface ExtractedKey {
  key: string;
  text: string;
  file: string;
}

/**
 * Scan a list of source files and pull out every `t("…")` call.
 * Returns one `ExtractedKey` per unique key (last occurrence wins on text).
 */
export async function extractKeysFromFiles(files: string[]): Promise<Map<string, ExtractedKey>> {
  const keys = new Map<string, ExtractedKey>();

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, "utf-8");
      const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

      visit(sourceFile);

      function visit(node: ts.Node): void {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "t" &&
          node.arguments.length >= 1
        ) {
          const arg = node.arguments[0]!;
          const isPlainTemplate = ts.isNoSubstitutionTemplateLiteral(arg) && arg.text.trim();
          if ((ts.isStringLiteral(arg) || isPlainTemplate) && arg.text.trim()) {
            const key = toKey(relPath, arg.text);
            keys.set(key, { key, text: arg.text, file: relPath });
          }
        }
        ts.forEachChild(node, visit);
      }
    }),
  );

  return keys;
}
