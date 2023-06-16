import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import '$src/infra/test/statusCodeExpect';
import {
  TestUser,
  createTestFastifyApp,
  withoutForeignKeyCheck,
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
import { Outbound, OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';
import { OutboundProductSupply } from '../models/OutboundProductSupply';
import routes from '../routes/outbound-products';

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

  await withoutForeignKeyCheck(async () => {
    product = await repo(Product).save({
      name: 'test',
      unit: await repo(Unit).save({ name: 'unit', creator: { id: 1 } }),
    });

    warehouse = await repo(Warehouse).save({
      name: 'warehouse test',
      description: 'description',
      addressProvinceCode: 'P43',
      addressProvinceName: 'TARRAGONA',
      addressCityCode: 'C07.062',
      addressCityName: 'SON SERVERA',
      addressStreetCode: 'S43.001.00104',
      addressStreetName: 'Alicante  en  ur mas en pares',
      addressPostalCode: '7820',
      addressNumber: '9',
      addressNumberCode: 'N07.046.00097.00009.2965903CD5126N',
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
  });
});

afterAll(async () => {
  await app?.close();
});

describe('Update OutboundProduct', () => {
  let outbound: Outbound;

  beforeAll(async () => {
    outbound = await repo(Outbound).save({
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

    expect(response).statusCodeToBe(200);
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
    await withoutForeignKeyCheck(async () => {
      outbound = await repo(Outbound).save({
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
        size: { id: 1 },
        property: { id: 1 },
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
        size: { id: 1 },
        property: { id: 1 },
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
        size: { id: 1 },
        property: { id: 1 },
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
    });
  });

  it('should get single outbound-product', async () => {
    assert(app);
    assert(user);
    assert(product);

    const response = await user.inject({
      method: 'GET',
      url: `/${outboundProduct.id}`,
    });

    expect(response).statusCodeToBe(200);
    const data = response.json().data;
    expect(data).toMatchObject({
      id: outboundProduct.id,
      product: {
        id: product.id,
        name: product.name,
        unit: {
          name: expect.any(String),
        },
      },
    });
  });

  it('should get supply state', async () => {
    assert(app);
    assert(user);
    const response = await user.inject({
      method: 'GET',
      url: `/${outboundProduct.id}/supply-state`,
    });

    expect(response).statusCodeToBe(200);
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

    expect(response).statusCodeToBe(200);
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
        freeQuantity: 30,
        suppliedQuantity: 20,
        expectedQuantity: 20,
        bins: [
          {
            binId: bin1.id,
            binName: 'bin1',
            freeQuantity: 0,
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

    expect(response).statusCodeToBe(200);
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
