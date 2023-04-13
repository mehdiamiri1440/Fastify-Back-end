import 'reflect-metadata';

import { createTestFastifyApp } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';

let app: FastifyInstance | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
});

afterAll(async () => {
  await app?.close();
});

it.skip('should get first provinces', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/provinces?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [{ code: 'P15', formated_name: 'A coruña', id: 1, name: 'A CORUÑA' }],
    meta: {},
  });
});

it.skip('should get first city', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/cities?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        code: 'C43.001',
        formated_name: 'AIGUAMURCIA',
        id: 1,
        name: 'AIGUAMURCIA',
      },
    ],
    meta: {},
  });
});

it.skip('should get first street', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/streets?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        code: 'S43.001.50801',
        formated_name: 'A31',
        id: 1,
        name: 'A31',
      },
    ],
    meta: {},
  });
});

it.skip('should get first number', async () => {
  assert(app);

  const response = await app.inject({
    method: 'GET',
    url: '/postal_codes?page=1&pageSize=1',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        id: 1,
        number: 'S-N',
        code: 'N43.001.00001.00S-N.6301437CF6860A',
        postal_code: '43815',
      },
    ],
    meta: {},
  });
});
