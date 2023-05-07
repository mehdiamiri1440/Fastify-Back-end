import 'reflect-metadata';
import { createTestFastifyApp } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import AppDataSource from '$src/DataSource';

let app: FastifyInstance | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
});

afterAll(async () => {
  await app?.close();
});

it('should get first provinces', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/provinces?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        code: expect.any(String),
        formated_name: expect.any(String),
        id: expect.any(Number),
        name: expect.any(String),
      },
    ],
    meta: expect.any(Object),
  });
});

it('should get first city', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/cities?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        code: expect.any(String),
        formated_name: expect.any(String),
        id: expect.any(Number),
        name: expect.any(String),
      },
    ],
    meta: expect.any(Object),
  });
});

it('should get first street', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/streets?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        code: expect.any(String),
        formated_name: expect.any(String),
        id: expect.any(Number),
        name: expect.any(String),
      },
    ],
    meta: expect.any(Object),
  });
});

it('should get first number', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/postal-codes?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        id: expect.any(Number),
        number: expect.any(String),
        code: expect.any(String),
        postal_code: expect.any(String),
      },
    ],
    meta: expect.any(Object),
  });
});
