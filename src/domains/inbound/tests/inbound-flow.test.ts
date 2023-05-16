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
import { FastifyInstance, InjectOptions } from 'fastify';
import { Product } from '../../product/models/Product';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import routes from '../routes';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { ProductStockHistory } from '$src/domains/product/models/ProductStockHistory';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;
let bins: Bin[] = [];
let supplier: Supplier | undefined;

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
    provinceCode: 'provinceCode',
    cityCode: 'cityCode',
    streetCode: 'streetCode',
    streetName: 'streetName',
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

  bins = [
    await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    }),
    await repo(Bin).save({
      name: 'bin2',
      warehouse,
      internalCode: 'bin2',
      creator: { id: 1 },
    }),
  ];

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

  await enableForeignKeyCheck();
});

afterAll(async () => {
  await app?.close();
});

const inject = async (options: InjectOptions) => {
  assert(user);
  const response = await user.inject(options);
  expect(response.statusCode).toBe(200);

  if (
    response.headers['content-type']?.toString().startsWith('application/json')
  ) {
    return response.json().data;
  }

  return null;
};

it('Inbound Flow', async () => {
  assert(app);
  assert(user);
  assert(product);
  assert(supplier);

  const createInboundResult = await inject({
    method: 'POST',
    url: '/inbounds/new',
    payload: {
      products: [
        {
          productId: product.id,
          supplierId: supplier.id,
          quantity: 5,
          price: 100,
        },
      ],
    },
  });

  // STEP: PRE DELIVERY
  expect(createInboundResult.status).toBe('pre_delivery');

  const inbound = await inject({
    method: 'GET',
    url: `/inbounds/${createInboundResult.id}`,
  });

  expect(inbound).toMatchObject({
    id: createInboundResult.id,
    status: 'pre_delivery',
    products: [
      {
        product: { id: product.id },
        supplier: { id: supplier.id },
        requestedQuantity: 5,
        price: 100,
      },
    ],
  });

  const confirmDeliveryResult = await inject({
    method: 'POST',
    url: `/inbounds/${inbound.id}/confirm-delivery`,
  });

  // STEP: LOAD
  expect(confirmDeliveryResult.status).toBe('load');

  for (const product of inbound.products) {
    await inject({
      method: 'POST',
      url: `/inbound-products/${product.id}/set-actual-quantity`,
      payload: {
        actualQuantity: 7,
      },
    });
  }

  const confirmLoadResult = await inject({
    method: 'POST',
    url: `/inbounds/${inbound.id}/confirm-load`,
  });

  // STEP: SORTING
  expect(confirmLoadResult.status).toBe('sorting');

  for (const product of inbound.products) {
    const sort = (quantity: number, binId: number) =>
      inject({
        method: 'POST',
        url: `/inbound-products/${product.id}/sorts`,
        payload: {
          binId,
          quantity,
        },
      });

    await sort(2, bins[0].id);
    await sort(5, bins[1].id);
  }

  const confirmSortResult = await inject({
    method: 'POST',
    url: `/inbounds/${inbound.id}/confirm-sort`,
  });

  // STEP: SORTED
  expect(confirmSortResult.status).toBe('sorted');

  // Check product tables state
  const binProducts = await repo(BinProduct).find({
    where: {
      product: {
        id: product.id,
      },
    },
    relations: {
      bin: true,
    },
  });

  expect(binProducts.length).toBe(2);
  expect(binProducts).toMatchObject([
    {
      bin: {
        id: bins[0].id,
      },
      quantity: 2,
    },
    {
      bin: {
        id: bins[1].id,
      },
      quantity: 5,
    },
  ]);

  // check product history
  const history = await repo(ProductStockHistory).find({});
  expect(history.length).toBe(2);
  expect(history).toMatchObject([
    {
      description: 'Sorted 2 test from inbound id: 1',
      quantity: 2,
      sourceId: 1,
      sourceType: 'inbound',
    },
    {
      description: 'Sorted 5 test from inbound id: 1',
      quantity: 5,
      sourceId: 1,
      sourceType: 'inbound',
    },
  ]);
});
