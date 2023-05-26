import 'reflect-metadata';

import {
  createTestFastifyApp,
  TestUser,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
} from '@jest/globals';
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

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let diffrences: CycleCountDifference[] | undefined;
let product: Product | undefined;
let bin: Bin | undefined;
let binProduct: BinProduct | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  // creating what we need
  await disableForeignKeyCheck();
  await repo(Product).save([
    { name: 'useless one' },
    { name: 'useless two' },
    { name: 'useless three' },
  ]);
  const warehouse = await repo(Warehouse).save({
    name: 'test warehouse',
    provinceCode: 'blah',
    cityCode: 'blah',
    streetCode: 'blah',
    streetName: 'blah',
    postalCode: 'blah',
  });
  product = await repo(Product).save({ name: 'test product' });
  const userId: number = (app.jwt.verify(user.token) as { id: number }).id;
  await repo(WarehouseStaff).save({ warehouse, user: { id: userId } }); // this if for that in product cycle count we just want to cycle count that bins is in user's warehouse
  await repo(Bin).save([
    { name: 'useless one', internalCode: 'useless one' },
    { name: 'useless two', internalCode: 'useless two' },
    { name: 'useless three', internalCode: 'useless three' },
  ]);
  bin = await repo(Bin).save({
    name: 'test bin',
    internalCode: 'test',
    warehouse,
  });
  await enableForeignKeyCheck();
  binProduct = await repo(BinProduct).save({ product, bin, quantity: 10 });
});

afterEach(async () => {
  await app?.close();
});

it('should create cycle count for product and get that by id', async () => {
  assert(app);
  assert(user);
  assert(product);
  assert(binProduct);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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

    expect(response.statusCode).toBe(200);
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
