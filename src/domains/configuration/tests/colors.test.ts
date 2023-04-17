import 'reflect-metadata';
import { AppDataSource } from '$src/databases/typeorm';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/colors';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let color_id: number;

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

it('should create a color', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/',
    payload: { name: 'test', code: '#FFFFFF' },
  });
  expect(response.json()).toMatchObject({
    data: {
      name: 'test',
      code: '#FFFFFF',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  color_id = response.json().data.id;
});

it('should get list of colors', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: color_id,
        name: 'test',
        code: '#FFFFFF',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a color', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/' + color_id,
    payload: { name: 'edit', code: '#000000' },
  });

  expect(response.json()).toMatchObject({
    data: {
      generatedMaps: expect.any(Array),
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});
