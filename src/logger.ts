/**
 * Logger abstraction. Consumers can swap the default console logger for their
 * own (pino, winston, OpenTelemetry, etc.) without patching internal code.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class ConsoleLogger implements Logger {
  constructor(private readonly minLevel: LogLevel = "info") {}

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const prefix = `[i18n:${level}]`;
    return meta ? `${prefix} ${message} ${JSON.stringify(meta)}` : `${prefix} ${message}`;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) console.debug(this.format("debug", message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) console.info(this.format("info", message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) console.warn(this.format("warn", message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("error")) console.error(this.format("error", message, meta));
  }
}

export class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
