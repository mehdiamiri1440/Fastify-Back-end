import 'reflect-metadata';

import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
});

afterEach(async () => {
  await app?.close();
});

it('should validate iban', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/iban/validate/ES2820958297603648596978',
  });

  expect(response).statusCodeToBe(200);
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
