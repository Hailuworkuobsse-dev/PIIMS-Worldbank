import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env.js';
import { logger } from './logger.js';

export const s3 = new S3Client({
  region: env.S3_REGION,
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  }
});

export const S3_BUCKET = env.S3_BUCKET;

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * File storage abstraction — used by M10 (Documents), M20 (Media),
 * M22 (Datasets), and report generation (M11).
 */
export const storage = {
  async upload(key: string, body: Buffer | Uint8Array, opts: UploadOptions = {}): Promise<string> {
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: opts.contentType,
        Metadata: opts.metadata
      })
    );
    logger.info({ key, size: body.length }, 'file uploaded');
    return key;
  },

  async download(key: string): Promise<Buffer> {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    if (!res.Body) throw new Error(`Empty body for key: ${key}`);
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  },

  async delete(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    logger.info({ key }, 'file deleted');
  },

  async exists(key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  },

  async signedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }
};

export function assertStorageConfig(): void {
  const required = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET'] as const;
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing storage config: ${k}`);
  }
}