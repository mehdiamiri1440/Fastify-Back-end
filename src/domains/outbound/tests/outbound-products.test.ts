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
import { Outbound, OutboundStatus } from '../models/Outbound';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { OutboundProductSupply } from '../models/OutboundProductSupply';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;

const outboundProductsRepo = repo(OutboundProduct);

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

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

describe('Update OutboundProduct', () => {
  let outbound: Outbound;

  beforeAll(async () => {
    outbound = await repo(Outbound).save({
      code: 'code',
      creator: {
        id: 1,
      },
      warehouse,
    });
  });

  it('should patch outbound-product when inbound state is DRAFT', async () => {
    assert(app);
    assert(user);

    const outboundProduct = await outboundProductsRepo.save({
      product,
      outbound,
      price: 100,
      quantity: 30,
    });

    const response = await user.inject({
      method: 'PATCH',
      url: `/${outboundProduct.id}`,
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

    const entity = await outboundProductsRepo.findOne({
      where: { id: outboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.quantity).toBe(200);
  });
});

describe('Supply', () => {
  let outboundProduct: OutboundProduct;
  let bin1: Bin;
  let bin2: Bin;
  let bin3: Bin;
  let outbound: Outbound;

  beforeAll(async () => {
    /**
     * Here we create many BinProduct rows for a single product
     */
    await disableForeignKeyCheck();

    outbound = await repo(Outbound).save({
      code: 'code',
      creator: {
        id: 1,
      },
      warehouse,
      status: OutboundStatus.NEW_ORDER,
    });

    outboundProduct = await outboundProductsRepo.save({
      product,
      outbound,
      price: 100,
      quantity: 20,
    });

    bin1 = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });
    await repo(BinProduct).save({
      bin: bin1,
      product,
      quantity: 10,
    });

    bin2 = await repo(Bin).save({
      name: 'bin2',
      warehouse,
      internalCode: 'hey2',
      creator: { id: 1 },
    });
    await repo(BinProduct).save({
      bin: bin2,
      product,
      quantity: 20,
    });

    bin3 = await repo(Bin).save({
      name: 'bin3',
      warehouse,
      internalCode: 'hey3',
      creator: { id: 1 },
    });
    await repo(BinProduct).save({
      bin: bin3,
      product,
      quantity: 10,
    });

    await repo(OutboundProductSupply).save({
      outboundProduct,
      bin: bin3,
      quantity: 10,
    });

    await enableForeignKeyCheck();
  });

  it('should list outbound-products', async () => {
    assert(app);
    assert(user);
    const response = await user.inject({
      method: 'GET',
      url: `/${outboundProduct.id}/supply-state`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        supplied: false,
        freeQuantity: 40,
        suppliedQuantity: 10,
        expectedQuantity: 20,
        bins: [
          {
            binId: bin1.id,
            binName: 'bin1',
            freeQuantity: 10,
            suppliedQuantity: 0,
          },
          {
            binId: bin2.id,
            binName: 'bin2',
            freeQuantity: 20,
            suppliedQuantity: 0,
          },
          {
            binId: bin3.id,
            binName: 'bin3',
            freeQuantity: 10,
            suppliedQuantity: 10,
          },
        ],
      },
    });
  });

  it('should supply a free bin', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'POST',
      url: `/${outboundProduct.id}/supplies`,
      payload: {
        binId: bin1.id,
        quantity: 10,
      },
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();

    const stateResponse = await user.inject({
      method: 'GET',
      url: `/${outboundProduct.id}/supply-state`,
    });

    expect(stateResponse.statusCode).toBe(200);
    const state = stateResponse.json();
    expect(state).toMatchObject({
      data: {
        supplied: true,
        freeQuantity: 40, // TODO(erfan): should be 30 after integrate with Product domain
        suppliedQuantity: 20,
        expectedQuantity: 20,
        bins: [
          {
            binId: bin1.id,
            binName: 'bin1',
            freeQuantity: 10, // TODO(erfan): should be 0 after integrate with Product domain
            suppliedQuantity: 10,
          },
          {
            binId: bin2.id,
            binName: 'bin2',
            freeQuantity: 20,
            suppliedQuantity: 0,
          },
          {
            binId: bin3.id,
            binName: 'bin3',
            freeQuantity: 10,
            suppliedQuantity: 10,
          },
        ],
      },
    });
    expect(result).toMatchObject(state);
  });

  it('should supply a free bin', async () => {
    assert(app);
    assert(user);

    const response = await user.inject({
      method: 'DELETE',
      url: `/${outboundProduct.id}/supplies/${bin1.id}`,
    });

    expect(response.statusCode).toBe(200);
    const result = response.json();

    const stateResponse = await user.inject({
      method: 'GET',
      url: `/${outboundProduct.id}/supply-state`,
    });

    expect(stateResponse.statusCode).toBe(200);
    const state = stateResponse.json();
    expect(state).toMatchObject({
      data: {
        supplied: false,
        freeQuantity: 40,
        suppliedQuantity: 10,
        expectedQuantity: 20,
        bins: [
          {
            binId: bin1.id,
            binName: 'bin1',
            freeQuantity: 10,
            suppliedQuantity: 0,
          },
          {
            binId: bin2.id,
            binName: 'bin2',
            freeQuantity: 20,
            suppliedQuantity: 0,
          },
          {
            binId: bin3.id,
            binName: 'bin3',
            freeQuantity: 10,
            suppliedQuantity: 10,
          },
        ],
      },
    });
    expect(result).toMatchObject(state);
  });
});
