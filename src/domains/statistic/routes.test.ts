import 'reflect-metadata';

import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import qs from 'qs';

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

it('should count of all entities', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/statistics',
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject({
    suppliers: expect.any(Number),
    customers: expect.any(Number),
    products: expect.any(Number),
    inbounds: expect.any(Number),
    outbounds: expect.any(Number),
  });
});

const days = async (stringEntity: string) => {
  assert(app);
  assert(user);
  const response = await user.inject({
    method: 'GET',
    url:
      '/statistics/days?' +
      new URLSearchParams(
        qs.stringify({
          entity: stringEntity,
          filter: {
            createdAt: {
              $gte: '2023-06-10',
              $lte: '2023-06-20',
            },
          },
        }),
      ),
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data.length).toBe(10);
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      { date: expect.any(String), count: expect.any(String) },
    ]),
  );
};

it('should get count of new suppliers in day between two dates', async () => {
  await days('supplier');
});
it('should get count of new customers in day between two dates', async () => {
  await days('customer');
});
it('should get count of new products in day between two dates', async () => {
  await days('product');
});
it('should get count of new inbounds in day between two dates', async () => {
  await days('inbound');
});
it('should get count of new outbounds in day between two dates', async () => {
  await days('outbound');
});
