/* eslint-disable @typescript-eslint/no-non-null-assertion */
import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Role } from '$src/domains/user/models/Role';
import { User } from '$src/domains/user/models/User';
import { Bin } from '$src/domains/warehouse/models/Bin';
import '$src/infra/test/statusCodeExpect';
import {
  TestUser,
  createTestFastifyApp,
  initDataSourceForTest,
  withoutForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import {
  afterAll,
  beforeAll,
  afterEach,
  beforeEach,
  expect,
  it,
} from '@jest/globals';
import assert from 'assert';
import { FastifyInstance, InjectOptions } from 'fastify';
import { Product } from '../../product/models/Product';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import routes from '../routes';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let driver: User | undefined;
let product: Product | undefined;
let warehouse: Warehouse | undefined;
let bin: Bin | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await app.register(routes);
  await app.ready();
});

beforeEach(async () => {
  assert(app);
  await initDataSourceForTest();
  user = await TestUser.create(app);

  await withoutForeignKeyCheck(async () => {
    product = await repo(Product).save({
      name: 'test',
      unit: await repo(Unit).save({ name: 'unit', creator: { id: 1 } }),
      quantity: 10,
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
      type: 'clerk',
      creator: {
        id: 1,
      },
    });

    bin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      property: { id: 1 },
      size: { id: 1 },
      creator: { id: 1 },
    });
    await repo(BinProduct).save({
      bin: bin,
      product,
      quantity: 10,
    });
  });
});

afterAll(async () => {
  await app?.close();
});

const inject = async (options: InjectOptions) => {
  assert(user);
  const response = await user.inject(options);
  expect(response).statusCodeToBe(200);

  if (
    response.headers['content-type']?.toString().startsWith('application/json')
  ) {
    return response.json().data;
  }

  return null;
};

async function createDraft() {
  const createResult = await inject({
    method: 'POST',
    url: '/outbounds',
    payload: {
      products: [
        {
          productId: product!.id,
          quantity: 5,
        },
      ],
    },
  });
  // STEP: DRAFT

  expect(createResult.status).toBe('draft');
  expect(createResult.code).toContain('OT');
  const id = createResult.id;

  const confirmStep = () =>
    inject({
      method: 'POST',
      url: `/outbounds/${id}/confirm-current-step`,
    });

  return { id, confirmStep };
}

it('Outbound Flow - With Driver', async () => {
  assert(app);
  assert(user);

  const { id, confirmStep } = await createDraft();
  const confirmOrderResult = await confirmStep();

  // STATUS: NEW ORDER
  expect(confirmOrderResult.status).toBe('new_order');

  // doing the supply
  const outboundProducts = await inject({
    method: 'GET',
    url: `/outbounds/${id}/products`,
  });

  expect(outboundProducts).toHaveLength(1);
  assert(bin);

  for (const product of outboundProducts) {
    expect(product.availableQuantity).toBe(10);

    const beforeSupplyState = await inject({
      method: 'GET',
      url: `/outbound-products/${product.id}/supply-state`,
    });

    expect(beforeSupplyState).toMatchObject({
      supplied: false,
      freeQuantity: 10,
      suppliedQuantity: 0,
      expectedQuantity: 5,
    });

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
    expect(afterSupplyState).toMatchObject({
      supplied: true,
      freeQuantity: 5,
      suppliedQuantity: 5,
      expectedQuantity: 5,
    });
  }

  // confirm that the outbound was created
  const confirmSupply = await confirmStep();
  // STATE: TRANSFER
  expect(confirmSupply.status).toBe('transfer');

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-driver`,
    payload: {
      driverId: driver!.id,
    },
  });

  const confirmTransfer = await confirmStep();

  // STATE: PICKING
  expect(confirmTransfer.status).toBe('picking');

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

  const confirmPicking = await confirmStep();

  // STATE: PICKED
  expect(confirmPicking.status).toBe('picked');

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-customer-signature`,
    payload: {
      signature: 'creator-customer-id',
    },
  });

  const confirmPicked = await confirmStep();

  // STATE: DELIVERED
  expect(confirmPicked.status).toBe('delivered');

  const outboundFinal = await inject({
    method: 'GET',
    url: `/outbounds/${id}`,
  });

  expect(outboundFinal).toMatchObject({
    status: 'delivered',
    driver: {
      id: driver!.id,
      fullName: driver!.firstName + ' ' + driver!.lastName,
    },
    creatorSignature: 'creator-sign-id',
    customerSignature: 'creator-customer-id',
    driverSignature: 'creator-driver-id',
  });
});

it('Outbound Flow - Without Driver', async () => {
  assert(app);
  assert(user);

  const { id, confirmStep } = await createDraft();
  const confirmOrderResult = await confirmStep();

  // STATUS: NEW ORDER
  expect(confirmOrderResult.status).toBe('new_order');

  // doing the supply
  const outboundProducts = await inject({
    method: 'GET',
    url: `/outbounds/${id}/products`,
  });

  expect(outboundProducts).toHaveLength(1);
  assert(bin);

  for (const product of outboundProducts) {
    expect(product.availableQuantity).toBe(10);

    const beforeSupplyState = await inject({
      method: 'GET',
      url: `/outbound-products/${product.id}/supply-state`,
    });

    expect(beforeSupplyState).toMatchObject({
      supplied: false,
      freeQuantity: 10,
      suppliedQuantity: 0,
      expectedQuantity: 5,
    });

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
    expect(afterSupplyState).toMatchObject({
      supplied: true,
      freeQuantity: 5,
      suppliedQuantity: 5,
      expectedQuantity: 5,
    });
  }

  // confirm that the outbound was created
  const confirmSupply = await confirmStep();
  // STATE: TRANSFER
  expect(confirmSupply.status).toBe('transfer');

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-creator-signature`,
    payload: {
      signature: 'creator-sign-id',
    },
  });

  await inject({
    method: 'POST',
    url: `/outbounds/${id}/set-customer-signature`,
    payload: {
      signature: 'customer-sign-id',
    },
  });

  const confirmTransfer = await confirmStep();

  // STATE: PICKING
  expect(confirmTransfer.status).toBe('delivered');

  const outboundFinal = await inject({
    method: 'GET',
    url: `/outbounds/${id}`,
  });

  expect(outboundFinal).toMatchObject({
    status: 'delivered',
    creatorSignature: 'creator-sign-id',
    customerSignature: 'customer-sign-id',
  });
});
