/**
 * Extract the file path of the function that called t().
 * Stack frame index 2: caller of getCallerFile -> t -> actual call site.
 */
export function getCallerFile(): string {
  const err = new Error();
  const lines = err.stack?.split("\n") ?? [];

  // lines[0] = "Error"
  // lines[1] = getCallerFile (this fn)
  // lines[2] = t()
  // lines[3] = actual call site
  const frame = lines[3] ?? "";

  // Node.js format:  "    at Object.<anonymous> (/abs/path/to/file.ts:10:5)"
  // Also handles:    "    at /abs/path/to/file.ts:10:5"
  const match = frame.match(/\(([^)]+)\)/) ?? frame.match(/at\s+(.+):\d+:\d+/);
  if (!match) return "unknown";

  const filePath = match[1].replace(/:\d+:\d+$/, ""); // strip :line:col
  return filePath;
}
