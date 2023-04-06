import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';
import { Nationality } from './models/Nationality';
import { repo } from '$src/databases/typeorm';

const Nationalities = repo(Nationality);
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

it('should return all nationalities', async () => {
  assert(app);
  assert(user);

  const ndata = await Nationalities.save({ title: 'SPN' });

  const response = await user.inject({
    method: 'GET',
    url: '/nationalities',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        ...ndata,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ],
    meta: {},
  });
});
