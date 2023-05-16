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

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let driver: User | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;
let bin: Bin | undefined;

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

  driver = await repo(User).save({
    firstName: 'driver',
    lastName: 'driver',
    role: await repo(Role).save({
      title: 'driver',
      isActive: true,
    }),
    nif: 'B-6116622A',
    email: 'driver@exmaple.com',
    phoneNumber: '+989303590055',
    password: 'hackme',
    position: 'driver',
    isActive: true,
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

  bin = await repo(Bin).save({
    name: 'bin1',
    warehouse,
    internalCode: 'hey1',
    creator: { id: 1 },
  });
  await repo(BinProduct).save({
    bin: bin,
    product,
    quantity: 10,
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

it('Outbound Flow - With Driver', async () => {
  assert(app);
  assert(user);
  assert(product);
  assert(driver);

  const createResult = await inject({
    method: 'POST',
    url: '/outbounds',
    payload: {
      products: [
        {
          productId: product.id,
          quantity: 5,
        },
      ],
    },
  });
  // STEP: DRAFT

  expect(createResult.status).toBe('draft');
  const id = createResult.id;

  // confirm that the outbound was created
  const confirmOrderResult = await inject({
    method: 'POST',
    url: `/outbounds/${id}/confirm-order`,
  });

  // SET: NEW ORDER
  expect(confirmOrderResult.status).toBe('new_order');

  // doing the supply
  const outbound = await inject({
    method: 'GET',
    url: `/outbounds/${id}`,
  });

  expect(outbound.products).toHaveLength(1);
  assert(bin);

  for (const product of outbound.products) {
    const beforeSupplyState = await inject({
      method: 'GET',
      url: `/outbound-products/${product.id}/supply-state`,
    });
    expect(beforeSupplyState.supplied).toBe(false);

    await inject({
      method: 'POST',
      url: `/outbound-products/${product.id}/supplies`,
      payload: {
        quantity: 5,
        binId: bin.id,
      },
    });

    const afterSupplyState = await inject({
      method: 'GET',
      url: `/outbound-products/${product.id}/supply-state`,
    });
    expect(afterSupplyState.supplied).toBe(true);
  }

  // confirm that the outbound was created
  const confirmSupply = await inject({
    method: 'POST',
    url: `/outbounds/${id}/confirm-supply`,
  });

  // STATE: TRANSFER
  expect(confirmSupply.status).toBe('transfer');

  const setDriver = await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-driver`,
    payload: {
      driverId: driver.id,
    },
  });

  // STATE: PICKING
  expect(setDriver.status).toBe('picking');

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-creator-signature`,
    payload: {
      signature: 'creator-sign-id',
    },
  });

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-driver-signature`,
    payload: {
      signature: 'creator-driver-id',
    },
  });

  const confirmPicking = await inject({
    method: 'POST',
    url: `/outbounds/${id}/confirm-picking`,
  });

  // STATE: PICKED
  expect(confirmPicking.status).toBe('picked');

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-customer-signature`,
    payload: {
      signature: 'creator-customer-id',
    },
  });

  const confirmPicked = await inject({
    method: 'POST',
    url: `/outbounds/${id}/confirm-picked`,
  });

  // STATE: DELIVERED
  expect(confirmPicked.status).toBe('delivered');

  const outboundFinal = await inject({
    method: 'GET',
    url: `/outbounds/${id}`,
  });

  expect(outboundFinal).toMatchObject({
    status: 'delivered',
    driver: {
      id: driver.id,
      fullName: driver.firstName + ' ' + driver.lastName,
    },
    creatorSignature: 'creator-sign-id',
    customerSignature: 'creator-customer-id',
    driverSignature: 'creator-driver-id',
    products: [
      {
        quantity: 5,
        product: {
          id: product.id,
        },
      },
    ],
  });
});
