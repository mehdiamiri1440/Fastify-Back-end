import {
  TestUser,
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { describe } from 'node:test';
import 'reflect-metadata';
import { Product } from '../../product/models/Product';
import { Supplier } from '../../supplier/models/Supplier';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import { Inbound } from '../models/Inbound';
import routes from '../routes/inbounds';
import AppDataSource from '$src/DataSource';
import { repo } from '$src/infra/utils/repo';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let supplier: Supplier | undefined;
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
  });

  supplier = await repo(Supplier).save({
    name: 'test',
    cif: 'cif',
    iban: 'iban',
    email: 'email',
    phoneNumber: 'phone',
    accountNumber: 'account',
    language: {
      id: 1,
    },
    creator: {
      id: 1,
    },
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

describe('Create Inbound', () => {
  it('should create a new inbound', async () => {
    assert(app);
    assert(user);
    assert(product);
    assert(supplier);

    const response = await user.inject({
      method: 'POST',
      url: '/new',
      payload: {
        products: [
          {
            productId: product.id,
            supplierId: supplier.id,
            price: 100,
            quantity: 5,
          },
        ],
        driverId: 1,
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        type: 'new',
        status: 'pre_delivery',
        code: expect.any(String),
        docId: expect.any(Number),
        description: null,
        deletedAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: {},
    });
  });

  it('should create a returned inbound', async () => {
    assert(app);
    assert(user);
    assert(product);
    assert(supplier);

    const response = await user.inject({
      method: 'POST',
      url: '/returned',
      payload: {
        type: 'returned',
        products: [
          {
            productId: product.id,
            price: 100,
            quantity: 5,
          },
        ],
        driverId: 1,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        type: 'returned',
        status: 'pre_delivery',
        code: expect.any(String),
        docId: expect.any(Number),
        description: null,
        deletedAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: {},
    });
  });
});

describe('Get Inbound', () => {
  it('should get list of inbounds', async () => {
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
          type: 'new',
          status: 'pre_delivery',
          creator: { fullName: 'tester tester' },
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          type: 'returned',
          status: 'pre_delivery',
          creator: { fullName: 'tester tester' },
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it('should get inbound by id', async () => {
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
        type: 'new',
        status: 'pre_delivery',
        code: expect.any(String),
        products: [
          {
            actualQuantity: null,
            id: 1,
            price: 100,
            requestedQuantity: 5,
            product: {
              id: 1,
              name: 'test',
            },
            supplier: {
              id: 1,
              name: 'test',
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

describe('Delete Inbound', () => {
  it('should delete inbound', async () => {
    const Inbounds = repo(Inbound);
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'DELETE',
      url: '/1',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toMatchObject({
      data: {
        type: 'new',
        status: 'pre_delivery',
        code: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    const inbound = await Inbounds.findOne({
      where: { id: 1 },
      withDeleted: true,
    });
    expect(inbound?.deletedAt).not.toBeNull();
  });
});
