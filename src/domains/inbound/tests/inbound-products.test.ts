import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';
import '$src/infra/test/statusCodeExpect';
import {
  createTestFastifyApp,
  withoutForeignKeyCheck,
  TestUser,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import assert from 'assert';
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { DeepPartial } from 'typeorm';
import { Product } from '../../product/models/Product';
import { Supplier } from '../../supplier/models/Supplier';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { Inbound, InboundStatus, InboundType } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import routes from '../routes/inbound-products';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const createSampleBin = async (
  warehouse: Warehouse,
  overrides?: DeepPartial<Bin>,
) => {
  return await withoutForeignKeyCheck(async () => {
    return await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'internalCode1',
      physicalCode: randomUUID(),
      property: { id: 1 },
      size: { id: 1 },
      creator: { id: 1 },
      ...overrides,
    });
  });
};

const createSampleProduct = async (overrides?: DeepPartial<Product>) =>
  await repo(Product).save({
    name: 'test',
    barcode: '123',
    invoiceSystemCode: 1,
    description: 'description',
    weight: 1,
    unit: await repo(Unit).save({
      id: 1,
      name: 'test',
      creator: { id: 1 },
    }),
    creator: { id: 1 },
    ...overrides,
  });

const createSampleSupplier = async (overrides?: DeepPartial<Supplier>) => {
  return await withoutForeignKeyCheck(async () => {
    return await repo(Supplier).save({
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
      ...overrides,
    });
  });
};

const createSampleInbound = async (
  warehouse: Warehouse,
  overrides?: DeepPartial<Inbound>,
) =>
  repo(Inbound).save({
    type: InboundType.NEW,
    status: InboundStatus.PRE_DELIVERY,
    creator: {
      id: 1,
    },
    warehouse,
    ...overrides,
  });

const createSampleWarehouse = async (overrides?: DeepPartial<Warehouse>) => {
  assert(user);
  const warehouse = await repo(Warehouse).save({
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
    ...overrides,
  });

  await repo(WarehouseStaff).save({
    name: 'warehouse test',
    description: 'description',
    user: {
      id: user.id,
    },
    warehouse,
    creator: {
      id: 1,
    },
  });

  return warehouse;
};

beforeAll(async () => {
  app = await createTestFastifyApp();
  await app.register(routes);
  await app.ready();
});

beforeEach(async () => {
  assert(app);
  await AppDataSource.synchronize(true);
  user = await TestUser.create(app);
});

afterAll(async () => {
  await app?.close();
});

describe('InboundProduct list', () => {
  it('should get list of inbound-products', async () => {
    assert(app);
    assert(user);

    const InboundProducts = repo(InboundProduct);
    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse);

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

    const response = await user.inject({
      method: 'GET',
      url: '/',
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data).toMatchObject([
      {
        id: expect.any(Number),
        createdAt: expect.any(String),
        requestedQuantity: 20,
        actualQuantity: 21,
      },
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
    ]);
  });
});

describe('Update InboundProduct', () => {
  it('should set-price when inbound state is PRE_DELIVERY', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse, {
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
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
      url: `/${inboundProduct.id}/set-price`,
      payload: {
        price: 200,
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

    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse, {
      type: InboundType.NEW,
      status: InboundStatus.LOAD,
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

    expect(response).statusCodeToBe(200);

    const entity = await InboundProducts.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.actualQuantity).toBe(123);
  });

  it('should set-requested-quantity when inbound state is LOAD', async () => {
    assert(app);
    assert(user);
    const InboundProducts = repo(InboundProduct);

    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse, {
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
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
      url: `/${inboundProduct.id}/set-requested-quantity`,
      payload: {
        requestedQuantity: 20,
      },
    });

    expect(response).statusCodeToBe(200);

    const entity = await InboundProducts.findOne({
      where: { id: inboundProduct.id },
      withDeleted: true,
    });
    expect(entity?.deletedAt).toBeNull();
    expect(entity?.requestedQuantity).toBe(20);
  });
});

describe('Delete InboundProduct', () => {
  it('should delete inbound-product', async () => {
    assert(app);
    assert(user);

    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse, {
      type: InboundType.NEW,
      status: InboundStatus.PRE_DELIVERY,
    });

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

    expect(response).statusCodeToBe(200);
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
  const init = async () => {
    const InboundProducts = repo(InboundProduct);

    const supplier = await createSampleSupplier();
    const product = await createSampleProduct();
    const warehouse = await createSampleWarehouse();
    const inbound = await createSampleInbound(warehouse, {
      type: InboundType.NEW,
      status: InboundStatus.SORTING,
    });
    const bin1 = await createSampleBin(warehouse, {
      name: 'bin1',
      internalCode: 'hey1',
    });
    const bin2 = await createSampleBin(warehouse, {
      name: 'bin2',
      internalCode: 'hey2',
    });

    const inboundProduct = await InboundProducts.save({
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

    return { inboundProduct, bin1, bin2 };
  };

  it('should sort', async () => {
    assert(app);
    assert(user);
    const { inboundProduct, bin1, bin2 } = await init();

    const response = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/sorts`,
      payload: {
        quantity: 10,
        binId: bin1.id,
      },
    });

    expect(response).statusCodeToBe(200);

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

  it('should delete a sort', async () => {
    assert(app);
    assert(user);
    const { inboundProduct, bin1 } = await init();

    const sortResponse = await user.inject({
      method: 'POST',
      url: `/${inboundProduct.id}/sorts`,
      payload: {
        quantity: 30,
        binId: bin1.id,
      },
    });

    expect(sortResponse).statusCodeToBe(200);
    const sort = sortResponse.json().data;

    expect(
      await repo(InboundProduct).findOneByOrFail({ id: inboundProduct.id }),
    ).toMatchObject({
      sorted: true,
    });

    const deleteSort = await user.inject({
      method: 'DELETE',
      url: `/${inboundProduct.id}/sorts/${sort.id}`,
    });

    expect(deleteSort).statusCodeToBe(200);

    expect(
      await repo(InboundProduct).findOneByOrFail({ id: inboundProduct.id }),
    ).toMatchObject({
      sorted: false,
    });
  });

  it('should throw error on duplicate sort on same bin', async () => {
    assert(app);
    assert(user);
    const { inboundProduct, bin1 } = await init();

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
