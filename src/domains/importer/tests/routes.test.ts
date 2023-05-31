import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { minio } from '$src/infra/s3';

import 'reflect-metadata';

import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes';
import { repo } from '$src/infra/utils/repo';
import { Language } from '$src/domains/supplier/models/Language';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Customer } from '$src/domains/customer/models/Customer';
import { Product } from '$src/domains/product/models/Product';
import { Client } from 'minio';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

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
          Resource: [`arn:aws:s3:::${bucketName}`],
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
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }),
  );
}

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
  assert(minio, 'Storage is not enable. missing env');
  await ensureBucket(minio, 'importer');
});

afterEach(async () => {
  await app?.close();
});

it('should parse suppliers data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await repo(Language).save({ id: 1, title: 'en' });
  await minio.putObject(
    'importer',
    'suppliers.csv',
    createReadStream(join(__dirname, `./test_data/suppliers.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/suppliers/check',
    payload: { fileId: 'suppliers.csv' },
  });

  expect(response).statusCodeToBe(200);
  const data = response.json().data;
  expect(data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        email: 'mostafa@delinternet.com',
      }),
    ]),
  );
});

it('should parse and insert suppliers data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await repo(Language).save({ id: 1, title: 'en' });
  await minio.putObject(
    'importer',
    'suppliers.csv',
    createReadStream(join(__dirname, `./test_data/suppliers.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/suppliers/insert',
    payload: { fileId: 'suppliers.csv' },
  });

  expect(response).statusCodeToBe(200);
  await AppDataSource.getRepository(Supplier).findOneByOrFail({
    email: 'mostafa@delinternet.com',
  });
});

it('should parse customers data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await repo(Nationality).save({ id: 1, title: 'en' });
  await minio.putObject(
    'importer',
    'customers.csv',
    createReadStream(join(__dirname, `./test_data/customers.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/customers/check',
    payload: { fileId: 'customers.csv' },
  });

  expect(response).statusCodeToBe(200);
  const data = response.json().data;
  expect(data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'goodcustomer',
      }),
    ]),
  );
});

it('should parse and insert customers data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await repo(Nationality).save({ id: 1, title: 'en' });
  await minio.putObject(
    'importer',
    'customers.csv',
    createReadStream(join(__dirname, `./test_data/customers.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/customers/insert',
    payload: { fileId: 'customers.csv' },
  });

  expect(response).statusCodeToBe(200);
  await AppDataSource.getRepository(Customer).findOneByOrFail({
    name: 'goodcustomer',
  });
});

it('should parse products data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await minio.putObject(
    'importer',
    'products.csv',
    createReadStream(join(__dirname, `./test_data/products.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/products/check',
    payload: { fileId: 'products.csv' },
  });

  expect(response).statusCodeToBe(200);
  const data = response.json().data;
  expect(data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'iphone',
      }),
    ]),
  );
});

it('should parse and insert customers data successfully', async () => {
  assert(app);
  assert(user);
  assert(minio, 'Storage is not enable. missing env');

  await minio.putObject(
    'importer',
    'products.csv',
    createReadStream(join(__dirname, `./test_data/products.csv`)),
  );

  const response = await user.inject({
    method: 'POST',
    url: '/importer/products/insert',
    payload: { fileId: 'products.csv' },
  });

  expect(response).statusCodeToBe(200);
  await AppDataSource.getRepository(Product).findOneByOrFail({
    name: 'iphone',
  });
});
