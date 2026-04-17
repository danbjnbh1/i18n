import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  NoSuchKey,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { StorageError, I18nConfigError } from "../errors";
import type { Storage, TranslationMap } from "./types";

export interface S3StorageOptions {
  bucket: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * S3-compatible storage. Works with AWS S3, Cloudflare R2, Backblaze B2, MinIO.
 * Credentials and endpoint can be passed directly or sourced from env vars
 * via `S3Storage.fromEnv()` for ergonomic CLI use.
 */
export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageOptions) {
    if (!options.bucket) throw new I18nConfigError("S3 bucket is required");

    this.bucket = options.bucket;
    const clientConfig: S3ClientConfig = {
      region: options.region ?? "auto",
    };
    if (options.endpoint) clientConfig.endpoint = options.endpoint;
    if (options.accessKeyId && options.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      };
    }
    this.client = new S3Client(clientConfig);
  }

  static fromEnv(): S3Storage {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new I18nConfigError("S3_BUCKET env var required for S3 storage");

    return new S3Storage({
      bucket,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  private key(project: string, locale: string): string {
    return `${project}/${locale}.json`;
  }

  async read(project: string, locale: string): Promise<TranslationMap> {
    const key = this.key(project, locale);
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = await res.Body?.transformToString("utf-8");
      if (!body) return {};
      return JSON.parse(body) as TranslationMap;
    } catch (err) {
      if (err instanceof NoSuchKey) return {};
      throw new StorageError(`Failed to read s3://${this.bucket}/${key}`, err);
    }
  }

  async write(project: string, locale: string, data: TranslationMap): Promise<void> {
    const key = this.key(project, locale);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: JSON.stringify(data, null, 2) + "\n",
          ContentType: "application/json",
        }),
      );
    } catch (err) {
      throw new StorageError(`Failed to write s3://${this.bucket}/${key}`, err);
    }
  }
}
