import {
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
  TestUser,
} from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from '../routes/inbound-products';
import { Product } from '../../product/models/Product';
import { Supplier } from '../../supplier/models/Supplier';
import { describe } from 'node:test';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import { Inbound, InboundStatus, InboundType } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import { Unit } from '$src/domains/configuration/models/Unit';
import AppDataSource from '$src/DataSource';
import { repo } from '$src/infra/utils/repo';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let supplier: Supplier | undefined;
let warehouse: Warehouse | undefined;
let inbound: Inbound | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  await disableForeignKeyCheck();

  product = await repo(Product).save({
    name: 'test',
    unit: await repo(Unit).save({
      name: 'test',
    }),
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

  inbound = await repo(Inbound).save({
    code: 'code',
    type: InboundType.NEW,
    status: InboundStatus.PRE_DELIVERY,
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

describe('InboundProduct list', () => {
  it('should get list of inbound-products', async () => {
    assert(app);
    assert(user);
    assert(supplier);
    assert(product);

    const InboundProducts = repo(InboundProduct);

    await Promise.all([
      InboundProducts.save({
        supplier,
        product,
        inbound,
        price: 100,
        quantity: 10,
        actualQuantity: 10,
      }),
      InboundProducts.save({
        supplier,
        product,
        inbound,
        price: 200,
        quantity: 20,
        actualQuantity: 21,
      }),
    ]);

    const response = await user.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toMatchObject({
      data: [
        {
          id: expect.any(Number),
          createdAt: expect.any(String),

          quantity: 10,
          actualQuantity: 10,
          supplier: {
            id: supplier.id,
            name: supplier.name,
          },
          product: {
            id: product.id,
            name: product.name,
            unit: {
              id: product.unit.id,
              name: product.unit.name,
            },
          },
        },
        {
          id: expect.any(Number),
          createdAt: expect.any(String),
          quantity: 20,
          actualQuantity: 21,
        },
      ],
    });
  });
});

describe('Update InboundProduct', () => {
  it('should patch inbound-product when inbound state is PRE_DELIVERY', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const inboundProduct = await InboundProducts.save({
      supplier,
      product,
      inbound,
      price: 100,
      quantity: 10,
    });

    const response = await user.inject({
      method: 'PATCH',
      url: `/${inboundProduct.id}`,
      payload: {
        price: 200,
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

    const entity = await InboundProducts.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.price).toBe(200);
  });
});

describe('Delete InboundProduct', () => {
  it('should delete inbound-product', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const inboundProduct = await InboundProducts.save({
      supplier,
      product,
      inbound,
      price: 100,
      quantity: 10,
    });

    const response = await user.inject({
      method: 'DELETE',
      url: `/${inboundProduct.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toMatchObject({
      data: {
        id: inboundProduct.id,
        price: 100,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });

    const entity = await InboundProducts.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).not.toBeNull();
  });
});
