import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import AppDataSource from '$src/DataSource';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
});

afterAll(async () => {
  await app?.close();
});

it('should validate iban', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/iban/validate/ES2820958297603648596978',
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({
    bic: expect.any(String),
    bankName: expect.any(String),
  });
});

it('should not validate iban', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/iban/validate/randomshit',
  });

  expect(response.statusCode).toBe(400);
});
