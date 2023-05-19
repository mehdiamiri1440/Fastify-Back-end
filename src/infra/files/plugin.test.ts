import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { Client } from 'minio';
import plugin from './plugin';
// see https://github.com/fastify/light-my-request/issues/35
import '$src/infra/test/statusCodeExpect';
import FormData from 'form-data';
import assert from 'node:assert';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

async function ensureBucket(client: Client, bucketName: string) {
  // Check if the bucket already exists
  const bucketExists = await client.bucketExists(bucketName);
  if (bucketExists) {
    for await (const { name } of client.listObjects(
      bucketName,
      undefined,
      true,
    )) {
      await client.removeObject(bucketName, name);
    }

    await client.removeBucket(bucketName);
  }

  await client.makeBucket(bucketName);
  await client.setBucketPolicy(
    bucketName,
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: [
            's3:GetBucketLocation',
            's3:ListBucket',
            's3:ListBucketMultipartUploads',
          ],
          Resource: ['arn:aws:s3:::test-bucket'],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: [
            's3:AbortMultipartUpload',
            's3:DeleteObject',
            's3:GetObject',
            's3:ListMultipartUploadParts',
            's3:PutObject',
          ],
          Resource: ['arn:aws:s3:::test-bucket/*'],
        },
      ],
    }),
  );
}

let fastify: FastifyInstance;
const { S3_URI } = process.env;
assert(S3_URI, 'S3_URI env is required');
const s3Uri = new URL(S3_URI);

const minio = new Client({
  endPoint: s3Uri.hostname,
  port: s3Uri.port ? Number(s3Uri.port) : 9000,
  useSSL: s3Uri.protocol.startsWith('https'),
  accessKey: decodeURIComponent(s3Uri.username),
  secretKey: decodeURIComponent(s3Uri.password),
});

const bucketName = 'test-bucket';

describe('Upload, download', () => {
  beforeEach(async () => {
    fastify = Fastify();
    // fastify.register(fastifyMultipart);
    fastify.register(plugin, {
      minio: minio,
      bucketName: 'test-bucket',
      schema: {
        security: [{ apiKey: [] }],
      },
    });
    await fastify.ready();
    await ensureBucket(minio, bucketName);
  });

  afterEach(() => {
    return fastify.close();
  });

  it('POST /', async () => {
    const form = new FormData();
    form.append(
      'file',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
    );

    const response = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: form,
      headers: form.getHeaders(),
    });

    expect(response).statusCodeToBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('filename');
  });

  it('GET /:filename', async () => {
    await minio.putObject(
      bucketName,
      'test.txt',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
    );

    const response = await fastify.inject({
      method: 'GET',
      url: `/test.txt`,
    });

    expect(response).statusCodeToBe(200);
    expect(response.body).toBe('hety');
  });
});

describe('Errors', () => {
  it('should error on invalid mime-type', async () => {
    const fastify = Fastify();
    fastify.register(plugin, {
      minio: minio,
      bucketName: 'test-bucket',
      allowedMimeTypes: ['image/jpeg', 'image/png'],
    });
    await fastify.ready();
    await ensureBucket(minio, bucketName);

    const form = new FormData();
    form.append(
      'file',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
      {
        contentType: 'text/plain',
      },
    );

    const response = await fastify.inject({
      method: 'POST',
      url: '/',
      payload: form,
      headers: form.getHeaders(),
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body).toMatchObject({
      code: 'INVALID_MIME_TYPE',
    });
  });
});
