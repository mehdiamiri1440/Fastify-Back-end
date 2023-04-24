import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/units';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let unitId: number;

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

it('should create a unit', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/',
    payload: { name: 'test' },
  });
  expect(response.json()).toMatchObject({
    data: {
      name: 'test',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  unitId = response.json().data.id;
});

it('should get list of units', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: unitId,
        name: 'test',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a unit', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/' + unitId,
    payload: { name: 'edit' },
  });

  expect(response.statusCode).toBe(200);
});
