import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { Client } from 'minio';
import plugin, { Options } from './plugin';
// see https://github.com/fastify/light-my-request/issues/35
import '$src/infra/test/statusCodeExpect';
import assert from 'node:assert';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

async function ensureBucket(client: Client, bucketName: string) {
  // Check if the bucket already exists
  const bucketExists = await client.bucketExists(bucketName);
  if (!bucketExists) {
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

  for await (const { name } of client.listObjects(
    bucketName,
    undefined,
    true,
  )) {
    client.removeObject(bucketName, name);
  }
}

describe.skip('file plugin smoke test', () => {
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

  const options: Options = {
    bucketName: 'test-bucket',
    schema: {
      security: [{ apiKey: [] }],
    },
  };
  const bucketName = 'test-bucket';

  beforeEach(async () => {
    fastify = Fastify();
    // fastify.register(fastifyMultipart);
    fastify.register(plugin, options);
    await fastify.ready();
    await ensureBucket(minio, bucketName);
  });

  afterEach(() => {
    fastify.close();
  });

  it('GET /:filename - normal', async () => {
    await minio.putObject(
      bucketName,
      'image.jpg',
      createReadStream(join(__dirname, `./test_data/image.jpg`)),
    );

    const response = await fastify.inject({
      method: 'GET',
      url: `/image.jpg`,
    });

    expect(response).statusCodeToBe(200);
    expect(response.headers).toMatchObject({
      'content-type': 'image/webp',
    });
    expect(response.rawPayload.length).toBeGreaterThan(1000);
  });

  it('GET /:filename - thumbnail', async () => {
    await minio.putObject(
      bucketName,
      'image.jpg',
      createReadStream(join(__dirname, `./test_data/image.jpg`)),
    );

    const response = await fastify.inject({
      method: 'GET',
      url: `/image.jpg?thumbnail=true`,
    });

    expect(response).statusCodeToBe(200);
    expect(response.headers).toMatchObject({
      'content-type': 'image/webp',
    });
    expect(response.rawPayload.length).toBeGreaterThan(1000);
  });
});
