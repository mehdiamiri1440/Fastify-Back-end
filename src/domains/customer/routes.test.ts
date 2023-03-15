import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';

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

it('should create a nationality', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/nationalities',
    payload: {
      title: 'EN',
    },
  });

  expect(response.json()).toMatchObject({
    data: {
      createdAt: expect.any(String),
      creator: expect.objectContaining({ id: 1 }),
      deletedAt: null,
      title: 'EN',
      updatedAt: expect.any(String),
    },
    meta: {},
  });
});

it('should return all nationalities', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/nationalities',
    payload: {
      title: 'EN',
    },
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        createdAt: expect.any(String),
        creator: 1,
        deletedAt: null,
        title: 'EN',
        updatedAt: expect.any(String),
      },
    ],
    meta: {},
  });
});
