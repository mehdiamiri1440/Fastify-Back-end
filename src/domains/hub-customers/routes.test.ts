import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import assert from 'assert';

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

it('should get hub customers', async () => {
  assert(user);
  const response = await user.inject({
    method: 'GET',
    url: '/hub-customers?name=test',
  });
  expect(response).statusCodeToBe(200);
  expect(response.json()).toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ name: expect.stringContaining('test') }),
    ]),
    meta: {},
  });
});
