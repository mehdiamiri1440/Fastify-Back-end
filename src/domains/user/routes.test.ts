import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';
import {
  InputUserType,
  InputUserExample,
  UserType,
  UserExample,
} from './schemas/user.schema';

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

it('should create a user', async () => {
  assert(app);
  assert(user);

  const userdata: InputUserType = InputUserExample;
  const response = await user.inject({
    method: 'POST',
    url: '/users',
    payload: userdata,
  });

  expect(response.json()).toMatchObject({
    data: {
      ...userdata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all users', async () => {
  assert(app);
  assert(user);

  const userdata: UserType = UserExample;
  const response = await user.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.json()).toMatchObject({
    data: [{
      ...userdata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },],
    meta: {},
  });
});

it('should return a user that logged in', async () => {
  assert(app);
  assert(user);

  const userdata: UserType = UserExample;
  const response = await user.inject({
    method: 'GET',
    url: '/whoami',
  });

  expect(response.json()).toMatchObject({
    data: {
      ...userdata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});
