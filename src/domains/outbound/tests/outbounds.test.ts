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
import { Supplier } from '../../supplier/models/Supplier';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import routes from '../routes/outbounds';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;

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
    quantity: 10,
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

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

describe('Create Outbound', () => {
  it('should create a new outbound', async () => {
    assert(app);
    assert(user);
    assert(product);

    const response = await user.inject({
      method: 'POST',
      url: '/',
      payload: {
        products: [
          {
            productId: product.id,
            quantity: 5,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        status: 'draft',
        customerId: null,
        creatorSignature: null,
        driverSignature: null,
        customerSignature: null,
        deletedAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: {},
    });
  });
});

describe('Get Outbound', () => {
  it('should get list of outbounds', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: [
        {
          status: 'draft',
          creator: { fullName: 'tester tester' },
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it('should get outbound by id', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'GET',
      url: '/1',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        code: expect.any(String),
        products: [
          {
            id: 1,
            quantity: 5,
            product: {
              id: 1,
              name: 'test',
              // quantity: 10, // TODO(erfan)
              unit: {
                id: 1,
                name: 'unit',
              },
            },
            createdAt: expect.any(String),
          },
        ],
        creator: { id: 1, fullName: 'tester tester' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});

describe('Set CustomerId', () => {
  it('should set customer id when inbound state is draft', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'POST',
      url: '/1/set-customer',
      payload: {
        customerId: 11,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        customerId: 11,
      },
    });
  });
});

describe('Confirm Order', () => {
  it('should change the outbound status to new order phase', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'POST',
      url: '/1/confirm-order',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        status: 'new_order',
      },
    });
  });
});
