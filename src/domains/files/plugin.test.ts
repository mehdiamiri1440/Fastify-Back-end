import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import fastifyMultipart from '@fastify/multipart';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { Client } from 'minio';
import assert from 'node:assert';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { File } from './models/File';
import plugin from './plugin';
import '$src/infra/test/statusCodeExpect';

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

let app: FastifyInstance;
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
    app = await createTestFastifyApp();
    await AppDataSource.synchronize(true);
    await app.register(fastifyMultipart);
    app.register(plugin, {
      minio: minio,
      bucketName: 'test-bucket',
      schema: {
        security: [{ apiKey: [] }],
      },
    });

    await app.ready();
    await ensureBucket(minio, bucketName);
  });

  afterEach(() => {
    return app.close();
  });

  it('POST /', async () => {
    const form = new FormData();
    form.append(
      'file',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: form,
      headers: form.getHeaders(),
    });

    expect(response).statusCodeToBe(200);
    const data = response.json();
    expect(data).toHaveProperty('filename');

    expect(
      await repo(File).findBy({
        id: data.filename,
      }),
    ).toMatchObject([
      {
        id: data.filename,
        bucketName: 'test-bucket',
        mimetype: 'text/plain',
        size: expect.any(Number),
        originalName: 'test.txt',
      },
    ]);
  });

  it('GET /:filename', async () => {
    {
      const response = await app.inject({
        method: 'GET',
        url: `/test.txt`,
      });

      expect(response).statusCodeToBe(404);
      expect(response).errorCodeToBe('FILE_NOT_FOUND');
    }
    await minio.putObject(
      bucketName,
      'test.txt',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
    );
    {
      const response = await app.inject({
        method: 'GET',
        url: `/test.txt`,
      });

      expect(response).statusCodeToBe(200);
      expect(response.headers['content-disposition']).toBe(
        `attachment; filename="test.txt"`,
      );
      expect(response.body).toBe('hety');
    }
  });
});

describe('Errors', () => {
  beforeEach(async () => {
    app = await createTestFastifyApp();
    await AppDataSource.synchronize(true);
    await app.register(fastifyMultipart);
    app.register(plugin, {
      minio: minio,
      bucketName: 'test-bucket',
      allowedMimeTypes: ['image/jpeg', 'image/png'],
    });

    await app.ready();
    await ensureBucket(minio, bucketName);
  });

  afterEach(() => {
    return app.close();
  });

  it('should error on invalid mime-type', async () => {
    const form = new FormData();
    form.append(
      'file',
      createReadStream(join(__dirname, `./test_data/test.txt`)),
      {
        contentType: 'text/plain',
      },
    );

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: form,
      headers: form.getHeaders(),
    });

    expect(response).statusCodeToBe(400);
    const body = response.json();
    expect(body).toMatchObject({
      code: 'INVALID_MIME_TYPE',
    });
  });
});
