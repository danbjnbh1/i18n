/**
 * Resolve the file path of a function further up the call stack.
 *
 * Frame indexing (V8 stack format):
 *   lines[0] = "Error"
 *   lines[1] = getCallerFile (this function)
 *   lines[2] = direct caller of getCallerFile
 *   lines[2 + skipFrames] = N levels above the direct caller
 *
 * @param skipFrames Number of additional stack frames to walk up beyond the
 *                   immediate caller. Default 1 walks past the immediate caller
 *                   to its caller — useful when wrapping `t()`.
 */
export function getCallerFile(skipFrames = 1): string {
  const err = new Error();
  const lines = err.stack?.split("\n") ?? [];
  const frame = lines[2 + skipFrames] ?? "";

  // V8 formats:
  //   "    at functionName (/abs/path/file.ts:10:5)"
  //   "    at /abs/path/file.ts:10:5"
  //   "    at async fn (/abs/path/file.ts:10:5)"
  const parenMatch = frame.match(/\(([^)]+)\)/);
  const bareMatch = frame.match(/at\s+(.+):\d+:\d+/);
  const raw = parenMatch?.[1] ?? bareMatch?.[1];
  if (!raw) return "unknown";

  return raw.replace(/:\d+:\d+$/, "").replace(/^file:\/\//, "");
}
