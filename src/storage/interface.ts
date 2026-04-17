export interface Storage {
  read(project: string, locale: string): Promise<Record<string, string>>;
  write(project: string, locale: string, data: Record<string, string>): Promise<void>;
}
