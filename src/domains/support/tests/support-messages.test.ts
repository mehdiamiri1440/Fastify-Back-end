import 'reflect-metadata';
import { AppDataSource } from '$src/databases/typeorm';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/support-messages';

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

it('should create a support message', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/',
    payload: { subject: 'test', message: 'i need help' },
  });
  expect(response.json()).toMatchObject({
    data: {
      subject: 'test',
      message: 'i need help',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});
