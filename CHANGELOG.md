# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added
- `init()` / `t()` runtime API with auto file detection via stack trace
- `I18n` class for multi-instance use
- Pluggable storage layer: `LocalStorage`, `S3Storage`, custom adapters
- Pluggable translation providers: `GeminiProvider` + `TranslationProvider` interface
- Logger abstraction: `ConsoleLogger`, `SilentLogger`
- Typed error hierarchy: `I18nError`, `I18nNotInitializedError`, `I18nConfigError`, `StorageError`, `TranslationError`
- CLI: `i18n-translate <src-dir> <locale...>` with file scanner, extractor, and sync orchestrator
- Vitest test suite for pure functions and local storage
- ESLint v9 flat config + Prettier + EditorConfig
- GitHub Actions CI
