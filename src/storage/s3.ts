import { S3Client, GetObjectCommand, PutObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { StorageError } from "../errors";
import { DEFAULT_S3_BUCKET, DEFAULT_S3_REGION, DEFAULT_S3_PROFILE } from "../constants";
import type { Storage, TranslationMap } from "./types";

export interface S3StorageOptions {
  bucket: string;
  region: string;
  profile: string;
}

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      credentials: fromIni({ profile: options.profile }),
    });
  }

  static fromEnv(): S3Storage {
    return new S3Storage({
      bucket: process.env.S3_BUCKET ?? DEFAULT_S3_BUCKET,
      region: process.env.S3_REGION ?? DEFAULT_S3_REGION,
      profile: process.env.AWS_PROFILE ?? DEFAULT_S3_PROFILE,
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
