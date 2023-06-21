import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/brands';
import '$src/infra/test/statusCodeExpect';
import { File } from '$src/domains/files/models/File';
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

it('should create/get/update a brand', async () => {
  assert(app);
  assert(user);

  let brandId: number;

  {
    // create

    await repo(File).save({
      id: 'file.jpg',
      bucketName: 'bucketName',
      mimetype: 'text/plain',
      originalName: 'original.txt',
      size: 100,
    });

    const response = await user.inject({
      method: 'POST',
      url: '/',
      payload: { name: 'test', logoId: 'file.jpg' },
    });
    expect(response.json()).toMatchObject({
      data: {
        name: 'test',
        logo: {
          id: 'file.jpg',
          bucketName: 'bucketName',
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    brandId = response.json().data.id;
  }
  {
    // get
    const response = await user.inject({
      method: 'GET',
      url: '/',
    });
    expect(response.json().data).toMatchObject([
      {
        id: brandId,
        name: 'test',
        logo: {
          id: 'file.jpg',
          bucketName: 'bucketName',
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  {
    // update
    const response = await user.inject({
      method: 'PUT',
      url: '/' + brandId,
      payload: { name: 'edit', fileId: 'file.jpg' },
    });

    expect(response).statusCodeToBe(200);
  }
});
