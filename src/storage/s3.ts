import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import type { Storage } from "./interface";

export class S3Storage implements Storage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? "auto";
    const bucket = process.env.S3_BUCKET;

    if (!bucket) throw new Error("S3_BUCKET env var required for S3 storage");

    this.bucket = bucket;
    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  private key(project: string, locale: string): string {
    return `${project}/${locale}.json`;
  }

  async read(project: string, locale: string): Promise<Record<string, string>> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: this.key(project, locale) })
      );
      const body = await res.Body?.transformToString("utf-8");
      if (!body) return {};
      return JSON.parse(body) as Record<string, string>;
    } catch (err) {
      if (err instanceof NoSuchKey) return {};
      throw err;
    }
  }

  async write(project: string, locale: string, data: Record<string, string>): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(project, locale),
        Body: JSON.stringify(data, null, 2) + "\n",
        ContentType: "application/json",
      })
    );
  }
}
