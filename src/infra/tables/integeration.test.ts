import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { beforeAll, afterAll, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import 'reflect-metadata';
import '$src/infra/test/statusCodeExpect';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from './PaginatedType';
import { TableQueryBuilder } from './Table';
import { Tag } from '$src/domains/configuration/models/Tag';
import { repo } from '../utils/repo';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const tags = repo(Tag);

const plugin: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/', {
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id']),
        filter: Filter({
          id: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(tags, req).exec();
    },
  });
};

beforeAll(async () => {
  app = await createTestFastifyApp();
  await app.register(plugin);
  await app.ready();
});

beforeEach(async () => {
  assert(app);
  await AppDataSource.synchronize(true);
  user = await TestUser.create(app);
});

afterAll(async () => {
  await app?.close();
});

it('without filter', async () => {
  assert(app);
  assert(user);

  await tags.insert([
    {
      name: 'the Name here',
      creator: { id: 1 },
    },
    {
      name: 'the second name',
      creator: { id: 1 },
    },
  ]);

  const response = await user.inject({
    method: 'GET',
    url: '/',
  });
  expect(response).statusCodeToBe(200);
  expect(response.json().data).toHaveLength(2);
});

it('with id like filter', async () => {
  assert(app);
  assert(user);

  const tag1 = await tags.save({
    name: 'the Name here',
    creator: { id: 1 },
  });

  await tags.save({
    name: 'the second name',
    creator: { id: 1 },
  });

  const response = await user.inject({
    method: 'GET',
    url: `/?filter.id.$like=%${tag1.id}%`,
  });
  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject([
    {
      name: 'the Name here',
    },
  ]);

  const responseB = await user.inject({
    method: 'GET',
    url: `/?filter.id.$like=%86578%`,
  });
  expect(responseB).statusCodeToBe(200);
  expect(responseB.json().data).toMatchObject([]);
});
