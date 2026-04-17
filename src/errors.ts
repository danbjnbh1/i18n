/**
 * Typed error hierarchy. Lets consumers catch by category instead of string-matching messages.
 */

export class I18nError extends Error {
  public override readonly name: string = "I18nError";

  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class I18nNotInitializedError extends I18nError {
  public override readonly name = "I18nNotInitializedError";

  constructor() {
    super("i18n not initialized — call init() first");
  }
}

export class I18nConfigError extends I18nError {
  public override readonly name = "I18nConfigError";
}

export class StorageError extends I18nError {
  public override readonly name = "StorageError";
}

export class TranslationError extends I18nError {
  public override readonly name = "TranslationError";
}
