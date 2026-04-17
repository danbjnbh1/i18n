import fs from "fs";
import path from "path";
import type { Storage } from "./interface";

export class LocalStorage implements Storage {
  constructor(private localesDir: string) {}

  private filePath(project: string, locale: string): string {
    return path.join(this.localesDir, project, `${locale}.json`);
  }

  async read(project: string, locale: string): Promise<Record<string, string>> {
    const fp = this.filePath(project, locale);
    if (!fs.existsSync(fp)) return {};
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  }

  async write(project: string, locale: string, data: Record<string, string>): Promise<void> {
    const fp = this.filePath(project, locale);
    const dir = path.dirname(fp);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }
}
