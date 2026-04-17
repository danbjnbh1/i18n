# @dan-nachmany/i18n

[![npm](https://img.shields.io/npm/v/@dan-nachmany/i18n)](https://www.npmjs.com/package/@dan-nachmany/i18n)

Standalone i18n with auto key generation, pluggable storage (local / S3-compatible), and an LLM-powered translation CLI.

- **Zero key bookkeeping** — write `t("Welcome to the app")`, the key derives automatically from source location + string
- **Pluggable storage** — local filesystem, AWS S3, Cloudflare R2, Backblaze B2, MinIO
- **Pluggable translation** — Gemini included; implement `TranslationProvider` to swap in OpenAI / DeepL / Anthropic
- **Typed errors** — `I18nConfigError`, `StorageError`, `TranslationError`
- **Fully tested core**, strict TypeScript

## Install

```bash
npm install @danbjnbh1/i18n
```

## Quick start

```ts
import { init, t } from "@danbjnbh1/i18n";

await init({
  locale: "fr",
  fallback: "en",
  project: "my-app",
});

t("Welcome to the app");                          // → "Bienvenue dans l'application"
t("Hello {{name}}", { name: "Alice" });           // → "Bonjour Alice"
```

## How keys are generated

A key is `{file_slug}:{text_slug}`:

| Component  | Rule                                                     |
|------------|----------------------------------------------------------|
| File slug  | strip everything up to `src/`, drop extension, `/` → `_`, lowercase |
| Text slug  | lowercase, non-alphanumerics → `_`, max 30 chars         |

```ts
// src/pages/home.tsx
t("Welcome to the app")  // key: "pages_home:welcome_to_the_app"
```

The file path is detected automatically via the call stack — no need to pass `__filename`.

## Translation CLI

```bash
# Set GEMINI_API_KEY in .env, then:
npx i18n-translate ./src fr es ja
```

This walks `./src`, extracts every `t("…")` call, writes the source-of-truth `en.json`, and translates only missing keys for each target locale.

### CLI environment variables

| Variable                | Default      | Description                              |
|-------------------------|--------------|------------------------------------------|
| `GEMINI_API_KEY`        | *required*   | Google Gemini API key                    |
| `I18N_PROJECT`          | `app`        | Project name (storage namespace)         |
| `I18N_SOURCE_LOCALE`    | `en`         | Source-of-truth locale                   |
| `I18N_STORAGE`          | `local`      | `local` or `s3`                          |
| `LOCALES_DIR`           | `./locales`  | Local storage directory                  |
| `I18N_RATE_LIMIT_MS`    | `200`        | Delay between provider calls             |
| `LOG_LEVEL`             | `info`       | `debug` \| `info` \| `warn` \| `error`   |

### S3-compatible storage

```bash
S3_BUCKET=my-translations
S3_ENDPOINT=https://accountid.r2.cloudflarestorage.com   # optional, e.g. R2
S3_REGION=auto                                            # "auto" for R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Advanced usage

### Multiple instances (multi-tenant servers)

```ts
import { I18n } from "@danbjnbh1/i18n";

const enInstance = await I18n.create({ locale: "en", project: "tenant-a" });
const frInstance = await I18n.create({ locale: "fr", project: "tenant-a" });
```

### Custom storage adapter

```ts
import { init, type Storage } from "@danbjnbh1/i18n";

const memoryStore: Storage = {
  async read() { return {}; },
  async write() {},
};

await init({ locale: "en", project: "test", storageAdapter: memoryStore });
```

### Custom translation provider

```ts
import type { TranslationProvider } from "@danbjnbh1/i18n";

class OpenAIProvider implements TranslationProvider {
  async translate(text: string, locale: string) { /* ... */ }
}
```

## Project layout

```
src/
  index.ts              public API
  i18n.ts               I18n class + singleton
  config.ts, errors.ts, logger.ts, constants.ts
  core/                 key, caller, interpolate
  storage/              types, local, s3, factory
  translation/          types, gemini, languages
  cli/                  index, scanner, extractor, sync
tests/                  vitest suites
```

## License

MIT
