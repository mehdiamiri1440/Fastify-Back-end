import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let tokenWithPermission: string | undefined;
let tokenWithoutPermission: string | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  tokenWithPermission = app.jwt.sign(
    {
      type: 'access_token',
      id: 1,
      scope: 'user@user::list',
    },
    {
      expiresIn: 1000,
    },
  );
  tokenWithoutPermission = app.jwt.sign(
    {
      type: 'access_token',
      id: 1,
      scope: '',
    },
    {
      expiresIn: 1000,
    },
  );
});

afterEach(async () => {
  await app?.close();
});

it('should call route need token and permission with token and permission', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/needTokenAndPermission',
    headers: {
      Authorization: `Bearer ${tokenWithPermission}`,
    },
  });
  expect(response.statusCode).toBe(200);
});

it('should not call route need token and permission without permission', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/needTokenAndPermission',
    headers: {
      Authorization: `Bearer ${tokenWithoutPermission}`,
    },
  });
  expect(response.statusCode).toBe(403);
});

it('should call route need token with token', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/needToken',
    headers: {
      Authorization: `Bearer ${tokenWithoutPermission}`,
    },
  });
  expect(response.statusCode).toBe(200);
});

it('should not call route need token without token', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/needToken',
  });
  expect(response.statusCode).toBe(401);
});

it('should call route need nothing without anything', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/needNothing',
  });
  expect(response.statusCode).toBe(200);
});
