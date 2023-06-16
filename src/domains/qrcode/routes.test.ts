import {
  createTestFastifyApp,
  initDataSourceForTest,
  withoutForeignKeyCheck,
} from '$src/infra/test/utils';
import { FastifyInstance } from 'fastify';
import {
  beforeEach,
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { inferCodeType, QrCodeType } from './utils';
import Plugin from './routes';
import '$src/infra/test/statusCodeExpect';
import { Product } from '../product/models/Product';
import { repo } from '$src/infra/utils/repo';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await app.register(Plugin);
  await app.ready();
});

beforeEach(async () => {
  await initDataSourceForTest();
});

afterAll(async () => {
  await app.close();
});

describe('/qr/:code/info', () => {
  it('returns correct information for product', async () => {
    const productsRepo = repo(Product);

    await withoutForeignKeyCheck(async () => {
      await productsRepo.save({
        name: 'product test',
        description: 'description',
        creator: {
          id: 1,
        },
      });
    });

    const product = await productsRepo.findOneByOrFail({});

    const response = await app.inject({
      method: 'GET',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: `/qr/${product.code}/info`,
    });
    expect(response).statusCodeToBe(200);
    expect(response.json().data).toEqual({
      type: 'product',
      typeId: expect.any(Number),
    });
  });
});

describe('/qr/:code/svg', () => {
  it('returns SVG for given code', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/qr/SOMEPRODUCTCODE/svg',
    });
    expect(response).statusCodeToBe(200);
    expect(response.headers['content-type']).toBe('image/svg+xml');
    expect(response.body).toContain('<svg');
  });
});
