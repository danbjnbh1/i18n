/**
 * Substitute `{{name}}` placeholders in a template string.
 * Missing keys are left as-is so the gap is visible in dev/QA.
 *
 * @example
 *   interpolate("Hello {{name}}", { name: "Alice" }) // "Hello Alice"
 *   interpolate("Hello {{name}}", {})                // "Hello {{name}}"
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{{${key}}}` : String(value);
  });
}
