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
import { DeepPartial } from 'typeorm';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinProduct } from '$src/domains/product/models/BinProduct';

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

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

describe('InboundProduct list', () => {
  let inbound: Inbound | undefined;

  beforeAll(async () => {
    const InboundProducts = repo(InboundProduct);

    inbound = await repo(Inbound).save({
      code: 'code',
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
      creator: {
        id: 1,
      },
      warehouse,
    });

    await Promise.all([
      InboundProducts.save({
        supplier,
        product,
        inbound,
        price: 100,
        requestedQuantity: 10,
        actualQuantity: 10,
      }),
      InboundProducts.save({
        supplier,
        product,
        inbound,
        price: 200,
        requestedQuantity: 20,
        actualQuantity: 21,
      }),
    ]);
  });

  it('should get list of inbound-products', async () => {
    assert(app);
    assert(user);
    assert(supplier);
    assert(product);

    const response = await user.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data).toMatchObject([
      {
        id: expect.any(Number),
        createdAt: expect.any(String),
        requestedQuantity: 10,
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
        requestedQuantity: 20,
        actualQuantity: 21,
      },
    ]);
  });
});

describe('Update InboundProduct', () => {
  let inbound: Inbound | undefined;

  beforeAll(async () => {
    inbound = await repo(Inbound).save({
      code: 'code',
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
      creator: {
        id: 1,
      },
      warehouse,
    });
  });

  it('should set-price when inbound state is PRE_DELIVERY', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const inboundProduct = await InboundProducts.save<
      DeepPartial<InboundProduct>
    >({
      supplier,
      product,
      inbound,
      price: 100,
      requestedQuantity: 10,
    });

    const response = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/set-price`,
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

  it('should set-actual-quantity when inbound state is LOAD', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const inbound = await repo(Inbound).save({
      code: 'code',
      type: InboundType.NEW,
      status: InboundStatus.LOAD,
      creator: {
        id: 1,
      },
      warehouse,
    });

    const inboundProduct = await InboundProducts.save<
      DeepPartial<InboundProduct>
    >({
      supplier,
      product,
      inbound,
      price: 100,
      requestedQuantity: 10,
    });

    const response = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/set-actual-quantity`,
      payload: {
        actualQuantity: 123,
      },
    });

    expect(response.statusCode).toBe(200);

    const entity = await InboundProducts.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.actualQuantity).toBe(123);
  });
});

describe('Delete InboundProduct', () => {
  let inbound: Inbound | undefined;

  beforeAll(async () => {
    inbound = await repo(Inbound).save({
      code: 'code',
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
      creator: {
        id: 1,
      },
      warehouse,
    });
  });

  it('should delete inbound-product', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const inboundProduct = await InboundProducts.save<
      DeepPartial<InboundProduct>
    >({
      supplier,
      product,
      inbound,
      price: 100,
      requestedQuantity: 10,
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

describe('Sorting', () => {
  let inbound: Inbound | undefined;
  let inboundProduct: InboundProduct;
  let bin1: Bin;
  let bin2: Bin;

  beforeAll(async () => {
    bin1 = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });

    bin2 = await repo(Bin).save({
      name: 'bin2',
      warehouse,
      internalCode: 'hey2',
      creator: { id: 1 },
    });
  });

  const init = async () => {
    const InboundProducts = repo(InboundProduct);

    inbound = await repo(Inbound).save({
      code: 'code',
      type: InboundType.NEW,
      status: InboundStatus.SORTING,
      creator: {
        id: 1,
      },
      warehouse,
    });

    inboundProduct = await InboundProducts.save({
      supplier,
      product,
      inbound,
      price: 100,
      requestedQuantity: 30,
      actualQuantity: 30,
    });

    await repo(BinProduct).save({
      bin: bin1,
      product,
      quantity: 0,
    });

    await repo(BinProduct).save({
      bin: bin2,
      product,
      quantity: 0,
    });
  };

  it('should sort', async () => {
    await init();
    assert(app);
    assert(user);
    assert(inbound);

    const response = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/sorts`,
      payload: {
        quantity: 10,
        binId: bin1.id,
      },
    });

    expect(response.statusCode).toBe(200);

    expect(
      await repo(InboundProduct).findOneByOrFail({ id: inboundProduct.id }),
    ).toMatchObject({
      sorted: false,
    });

    const response2 = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/sorts`,
      payload: {
        quantity: 20,
        binId: bin2.id,
      },
    });

    expect(response2.statusCode).toBe(200);

    expect(
      await repo(InboundProduct).findOneByOrFail({ id: inboundProduct.id }),
    ).toMatchObject({
      sorted: true,
    });
  });

  describe('Sort Errors', () => {
    it('should throw error on duplicate sort on same bin', async () => {
      await init();

      assert(app);
      assert(user);

      const firstSort = await user.inject({
        method: 'POST',
        url: `/${inboundProduct.id}/sorts`,
        payload: {
          quantity: 10,
          binId: bin1.id,
        },
      });

      expect(firstSort.statusCode).toBe(200);

      const secondSort = await user.inject({
        method: 'POST',
        url: `/${inboundProduct.id}/sorts`,
        payload: {
          quantity: 10,
          binId: bin1.id,
        },
      });

      expect(secondSort.statusCode).toBe(400);
    });
  });
});
