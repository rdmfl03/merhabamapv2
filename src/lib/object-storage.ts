import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getEnv } from "@/lib/env";

export function isPublicObjectStorageConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.S3_BUCKET &&
      env.S3_ENDPOINT &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_REGION,
  );
}

/**
 * Upload a publicly readable object (e.g. profile avatar). DigitalOcean Spaces and other
 * S3-compatible endpoints are supported via env (see `.env.example`).
 */
export async function uploadPublicAvatarObject(
  body: Buffer,
  objectKey: string,
  contentType: string,
): Promise<string> {
  const env = getEnv();
  if (
    !env.S3_BUCKET ||
    !env.S3_ENDPOINT ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY ||
    !env.S3_REGION
  ) {
    throw new Error("uploadPublicAvatarObject called without object storage configured");
  }

  const client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const base =
    env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    `https://${env.S3_BUCKET}.${env.S3_REGION}.cdn.digitaloceanspaces.com`;

  return `${base}/${objectKey}`;
}
