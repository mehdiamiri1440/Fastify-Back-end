import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/categories';
import { Category } from '../models/Category';
import { repo } from '$src/infra/utils/repo';

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

it('should create a category without parent', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/',
    payload: { name: 'test', parentId: null },
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
});

it('should create a category with parent', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/',
    payload: { name: 'test', parentId: null },
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
});

it('should get list of categories', async () => {
  assert(app);
  assert(user);

  const c1 = await repo(Category).save({
    name: 'test1',
  });

  const c2 = await repo(Category).save({
    name: 'test2',
    parent: c1,
  });

  const response = await user.inject({
    method: 'GET',
    url: '/',
  });

  expect(response.json().data).toMatchObject([
    {
      id: c1.id,
      name: 'test1',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    {
      id: c2.id,
      name: 'test2',
      parent: {
        id: c1.id,
        name: 'test1',
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
  ]);
});

it('should update a category', async () => {
  assert(app);
  assert(user);

  const c1 = await repo(Category).save({
    name: 'test1',
  });

  const c2 = await repo(Category).save({
    name: 'test2',
    parent: c1,
  });

  const c3 = await repo(Category).save({
    name: 'test3',
  });

  const responseA = await user.inject({
    method: 'PUT',
    url: `/${c2.id}`,
    payload: { name: 'edit', parentId: null },
  });

  expect(responseA.statusCode).toBe(200);

  expect(
    await repo(Category).findOneOrFail({
      where: { id: c2.id },
      relations: {
        parent: true,
      },
    }),
  ).toMatchObject({
    name: 'edit',
    parent: null,
  });

  const responseB = await user.inject({
    method: 'PUT',
    url: `/${c2.id}`,
    payload: { name: 'edit', parentId: c3.id },
  });

  expect(responseB.statusCode).toBe(200);

  expect(
    await repo(Category).findOneOrFail({
      where: { id: c2.id },
      relations: {
        parent: true,
      },
    }),
  ).toMatchObject({
    name: 'edit',
    parent: {
      id: c3.id,
      name: 'test3',
    },
  });
});
