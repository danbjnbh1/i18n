import axios from "axios";
import { DEFAULT_S3_PUBLIC_URL } from "../constants";
import { StorageError } from "../errors";
import type { Storage, TranslationMap } from "./types";

export class HttpStorage implements Storage {
  private readonly baseUrl: string;

  constructor(baseUrl: string = DEFAULT_S3_PUBLIC_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async read(project: string, locale: string): Promise<TranslationMap> {
    const url = `${this.baseUrl}/${project}/${locale}.json`;
    try {
      const res = await axios.get<TranslationMap>(url);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return {};
      throw new StorageError(`Failed to fetch ${url}`, err);
    }
  }

  async write(): Promise<void> {
    throw new StorageError("HttpStorage is read-only");
  }
}
