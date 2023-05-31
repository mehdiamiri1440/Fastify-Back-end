import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/colors';
import '$src/infra/test/statusCodeExpect';

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

it('should create/get/update a color', async () => {
  assert(app);
  assert(user);
  let colorId: number;

  {
    // create
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
    colorId = response.json().data.id;
  }
  {
    // get
    const response = await user.inject({
      method: 'GET',
      url: '/',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: colorId,
          name: 'test',
          code: '#FFFFFF',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
  }
  {
    // update
    const response = await user.inject({
      method: 'PUT',
      url: '/' + colorId,
      payload: { name: 'edit', code: '#000000' },
    });

    expect(response).statusCodeToBe(200);
  }
});
