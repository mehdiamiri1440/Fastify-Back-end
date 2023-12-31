import 'reflect-metadata';

import {
  createTestFastifyApp,
  TestUser,
  withoutForeignKeyCheck,
} from '$src/infra/test/utils';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import AppDataSource from '$src/DataSource';
import { repo } from '$src/infra/utils/repo';
import { Product } from '$src/domains/product/models/Product';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { CycleCount } from '$src/domains/cyclecount/models/CycleCount';
import { CycleCountDifference } from '$src/domains/cyclecount/models/Difference';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import {
  CYCLE_COUNT_IS_NOT_OPEN,
  EMPTY_BIN,
  MISS_BIN,
  MISS_PRODUCT,
  NOT_IN_ANY_BIN,
} from '$src/domains/cyclecount/errors';
import '$src/infra/test/statusCodeExpect';

let app: FastifyInstance;
let user: TestUser;

let product: Product;
let bin: Bin;
let binProduct: BinProduct;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  // creating what we need
  await withoutForeignKeyCheck(async () => {
    await repo(Product).save([
      { name: 'useless one' },
      { name: 'useless two' },
      { name: 'useless three' },
    ]);
    const warehouse = await repo(Warehouse).save({
      name: 'test warehouse',
      addressProvinceCode: 'P43',
      addressProvinceName: 'TARRAGONA',
      addressCityCode: 'C07.062',
      addressCityName: 'SON SERVERA',
      addressStreetCode: 'S43.001.00104',
      addressStreetName: 'Alicante  en  ur mas en pares',
      addressPostalCode: '7820',
      addressNumber: '9',
      addressNumberCode: 'N07.046.00097.00009.2965903CD5126N',
      creator: { id: 1 },
    });
    product = await repo(Product).save({ name: 'test product' });
    const userId: number = (app.jwt.verify(user.token) as { id: number }).id;
    await repo(WarehouseStaff).save({
      warehouse,
      user: { id: userId },
      creator: { id: 1 },
      type: 'clerk',
    }); // this if for that in product cycle count we just want to cycle count that bins is in user's warehouse
    await repo(Bin).save([
      {
        name: 'useless one',
        internalCode: 'useless one',
        warehouse: { id: 1 },
        size: { id: 1 },
        property: { id: 1 },
        creator: { id: 1 },
      },
      {
        name: 'useless two',
        internalCode: 'useless two',
        warehouse: { id: 1 },
        size: { id: 1 },
        property: { id: 1 },
        creator: { id: 1 },
      },
      {
        name: 'useless three',
        internalCode: 'useless three',
        warehouse: { id: 1 },
        size: { id: 1 },
        property: { id: 1 },
        creator: { id: 1 },
      },
    ]);
    bin = await repo(Bin).save({
      name: 'test bin',
      internalCode: 'test',
      warehouse,
      size: { id: 1 },
      property: { id: 1 },
      creator: { id: 1 },
    });
  });
  binProduct = await repo(BinProduct).save({ product, bin, quantity: 10 });
});

afterEach(async () => {
  await app?.close();
});

it('should create cycle count for product and get that by id', async () => {
  let cycleCount: CycleCount | undefined;

  {
    // creating
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts`,
      payload: {
        cycleCountType: 'Product',
        bin: null,
        product: product.id,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: expect.any(Number),
        product: { id: product.id },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    cycleCount = response.json().data;
  }
  {
    // get by id
    assert(cycleCount);
    const response = await user.inject({
      method: 'GET',
      url: `/cycle-counts/` + cycleCount.id,
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: cycleCount.id,
        cycleCountState: 'open',
        cycleCountType: 'Product',
        product: { id: product.id },
        bin: null,
        differences: [{ difference: 0, quantity: binProduct.quantity }],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
  }
});

const cycleCountWithChangedDifferences = async () => {
  assert(app);
  assert(user);
  assert(bin);

  let cycleCount: CycleCount | undefined;

  {
    // creating cycle count for bin
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts`,
      payload: {
        cycleCountType: 'Bin',
        bin: bin.id,
        product: null,
      },
    });

    expect(response).statusCodeToBe(200);
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        bin: { id: bin.id },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    cycleCount = response.json().data;
  }
  assert(cycleCount);
  {
    // getting list of cycle count
    const response = await user.inject({
      method: 'GET',
      url: `/cycle-counts/`,
    });

    expect(response).statusCodeToBe(200);
    expect(response.json().data).toMatchObject([
      {
        id: cycleCount.id,
        cycleCountType: 'Bin',
        cycleCountState: 'open',
        bin: cycleCount.bin,
        notMatch: null,
        checker: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  assert(binProduct);
  {
    // getting differences of cycle count
    const response = await user.inject({
      method: 'GET',
      url: `/cycle-counts/${cycleCount.id}/differences`,
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body.data).toMatchObject([
      {
        id: expect.any(Number),
        binProduct: expect.objectContaining({ id: binProduct.id }),
        difference: 0,
        counter: null,
        cycleCount: expect.objectContaining({ id: cycleCount.id }),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  {
    // set a difference as count
    const difference = await repo(CycleCountDifference).findOneOrFail({
      where: {
        binProduct: { id: binProduct.id },
      },
      relations: { binProduct: true, cycleCount: true },
    });

    const response = await user.inject({
      method: 'PUT',
      url: `/cycle-counts/${difference.cycleCount.id}/differences/${difference.id}/`,
      payload: { difference: -1 },
    });

    expect(response).statusCodeToBe(200);
  }
  return cycleCount;
};

it('should test the cycle count flow and apply changes', async () => {
  assert(app);
  assert(user);
  assert(bin);
  assert(binProduct);

  const cycleCount = await cycleCountWithChangedDifferences();
  {
    // apply cycle count
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${cycleCount.id}/apply`,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should not apply again
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${cycleCount.id}/apply`,
    });

    expect(response.statusCode).not.toBe(200);
  }
  {
    // binProduct should be edited
    const newBinProduct = await repo(BinProduct).findOneByOrFail({
      id: binProduct.id,
    });
    expect(newBinProduct.quantity).toBe(10 - 1);
  }
});
it('should test the cycle count flow and reject changes', async () => {
  assert(app);
  assert(user);
  assert(bin);
  assert(binProduct);

  const cycleCount = await cycleCountWithChangedDifferences();
  {
    // reject cycle count
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${cycleCount.id}/reject`,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should not reject again
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${cycleCount.id}/reject`,
    });

    expect(response.statusCode).not.toBe(200);
  }
  {
    // binProduct should not be edited
    const newBinProduct = await repo(BinProduct).findOneByOrFail({
      id: binProduct.id,
    });
    expect(newBinProduct.quantity).toBe(10);
  }
});

it('should error on apply/reject when cycle count is not open', async () => {
  assert(app);
  assert(user);
  const { appliedCycleCount, rejectedCycleCount } =
    await withoutForeignKeyCheck(async () => {
      const appliedCycleCount = await repo(CycleCount).save({
        cycleCountState: 'applied',
        cycleCountType: 'Product',
        creator: { id: 1 },
      });
      const rejectedCycleCount = await repo(CycleCount).save({
        cycleCountState: 'rejected',
        cycleCountType: 'Product',
        creator: { id: 1 },
      });
      return { appliedCycleCount, rejectedCycleCount };
    });

  {
    // should not reject again
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${rejectedCycleCount.id}/reject`,
    });

    expect(response).statusCodeToBe(400);
    expect(response.json().code).toBe(CYCLE_COUNT_IS_NOT_OPEN().code);
  }
  {
    // should not reject applied cycle count
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${appliedCycleCount.id}/reject`,
    });

    expect(response).statusCodeToBe(400);
    expect(response.json().code).toBe(CYCLE_COUNT_IS_NOT_OPEN().code);
  }
  {
    // should not apply again
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${appliedCycleCount.id}/apply`,
    });

    expect(response).statusCodeToBe(400);
    expect(response.json().code).toBe(CYCLE_COUNT_IS_NOT_OPEN().code);
  }
  {
    // should not apply rejected cycle count
    const response = await user.inject({
      method: 'POST',
      url: `/cycle-counts/${rejectedCycleCount.id}/apply`,
    });

    expect(response).statusCodeToBe(400);
    expect(response.json().code).toBe(CYCLE_COUNT_IS_NOT_OPEN().code);
  }
});

it('should error on report diff when cycle count is not open', async () => {
  const { difference } = await withoutForeignKeyCheck(async () => {
    const difference = await repo(CycleCountDifference).save({
      difference: 0,
      binProduct: { id: 1 },
      cycleCount: await repo(CycleCount).save({
        cycleCountState: 'applied',
        cycleCountType: 'Product',
        creator: { id: 1 },
      }),
    });
    return { difference };
  });

  {
    // should not reject again
    const response = await user.inject({
      method: 'PUT',
      url: `/cycle-counts/${difference.cycleCount.id}/differences/${difference.id}/`,
      payload: { difference: 1 },
    });

    expect(response).statusCodeToBe(400);
    expect(response.json().code).toBe(CYCLE_COUNT_IS_NOT_OPEN().code);
  }
});
it('should error on not sending bin id on creating cycle count for bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: `/cycle-counts/`,
    payload: { cycleCountType: 'Bin', product: null, bin: null },
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(MISS_BIN().code);
});

it('should error on not sending product id on creating cycle count for product', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: `/cycle-counts/`,
    payload: { cycleCountType: 'Product', product: null, bin: null },
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(MISS_PRODUCT().code);
});

it('should error on creating cycle count for bin that empty', async () => {
  assert(app);
  assert(user);

  const { bin } = await withoutForeignKeyCheck(async () => {
    const bin = await repo(Bin).save({
      name: 'useless',
      internalCode: 'useless',
      warehouse: { id: 1 },
      size: { id: 1 },
      property: { id: 1 },
      creator: { id: 1 },
    });
    return { bin };
  });

  const response = await user.inject({
    method: 'POST',
    url: `/cycle-counts/`,
    payload: { cycleCountType: 'Bin', product: null, bin: bin.id },
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(EMPTY_BIN().code);
});

it('should error on creating cycle count for product that not in any bin', async () => {
  assert(app);
  assert(user);

  const product = await repo(Product).save({ name: 'useless one' });

  const response = await user.inject({
    method: 'POST',
    url: `/cycle-counts/`,
    payload: { cycleCountType: 'Product', product: product.id, bin: null },
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(NOT_IN_ANY_BIN().code);
});
