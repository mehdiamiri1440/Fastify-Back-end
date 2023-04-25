import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import {
  TestUser,
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { describe } from 'node:test';
import 'reflect-metadata';
import { Product } from '../../product/models/Product';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import routes from '../routes/outbound-products';
import { OutboundProduct } from '../models/OutboundProduct';
import { Outbound } from '../models/Outbound';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;
let outbound: Outbound | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  await disableForeignKeyCheck();

  product = await repo(Product).save({
    name: 'test',
    unit: await repo(Unit).save({ name: 'unit' }),
  });

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

  await repo(WarehouseStaff).save({
    name: 'warehouse test',
    description: 'description',
    user: {
      id: 1,
    },
    warehouse,
    creator: {
      id: 1,
    },
  });

  outbound = await repo(Outbound).save({
    code: 'code',
    creator: {
      id: 1,
    },
    warehouse,
  });

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

describe('Update OutboundProduct', () => {
  it('should patch outbound-product when inbound state is DRAFT', async () => {
    assert(app);
    assert(user);
    const outboundsRepo = repo(OutboundProduct);

    const inboundProduct = await outboundsRepo.save({
      product,
      outbound,
      price: 100,
      quantity: 10,
    });

    const response = await user.inject({
      method: 'PATCH',
      url: `/${inboundProduct.id}`,
      payload: {
        quantity: 200,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toMatchObject({
      data: {
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    const entity = await outboundsRepo.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.quantity).toBe(200);
  });
});
