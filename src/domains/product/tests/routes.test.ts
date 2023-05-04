import AppDataSource from '$src/DataSource';
import {
  TestUser,
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterAll, beforeAll, it } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import 'reflect-metadata';
import { Warehouse } from '../../warehouse/models/Warehouse';
import routes from '../routes';
import assert from 'assert';
import { Product } from '../models/Product';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let warehouse: Warehouse | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  await disableForeignKeyCheck();

  warehouse = await repo(Warehouse).save({
    name: 'warehouse test',
    description: 'description',
    postalCode: 'postalCode',
    province: 'province',
    city: 'city',
    street: 'street',
    creator: {
      id: 1,
    },
  });

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

it('should return products list', async () => {
  assert(app);
  const productRepo = repo(Product);

  await productRepo.insert([
    {
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
    },
  ]);

  const response = await app.inject({
    method: 'GET',
    url: '/products',
  });
});
