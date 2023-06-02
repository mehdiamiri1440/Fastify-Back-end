import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import { Customer } from '$src/domains/customer/models/Customer';
import '$src/infra/test/statusCodeExpect';
import {
  TestUser,
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterAll, beforeAll, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { describe } from 'node:test';
import 'reflect-metadata';
import { Product } from '../../product/models/Product';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import { Outbound, OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';
import routes from '../routes/outbounds';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const createSampleProduct = async () =>
  repo(Product).save({
    name: 'test',
    unit: await repo(Unit).save({ name: 'unit', creator: { id: 1 } }),
    quantity: 10,
  });

const createSampleWarehouse = async () => {
  assert(user);
  await disableForeignKeyCheck();

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
  });

  await repo(WarehouseStaff).save({
    name: 'warehouse test',
    description: 'description',
    user: user?.user,
    warehouse,
    creator: {
      id: 1,
    },
  });
  await enableForeignKeyCheck();
  return warehouse;
};

const createSampleCustomer = async () => {
  await disableForeignKeyCheck();

  const customer = await repo(Customer).save({
    name: 'my name',
    contactName: 'my business name',
    subscriberType: 'empresa',
    documentType: 'dni',
    contactDocumentType: 'passaporte',
    fiscalId: 'my fiscal id 123456',
    contactFamily1: '1',
    nationality: { id: 1 },
    isActive: true,
    creator: { id: 1 },
  });

  await enableForeignKeyCheck();

  return customer;
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

describe('Get Outbound', () => {
  it('should get list of outbounds', async () => {
    const warehouse = await createSampleWarehouse();
    assert(app);
    assert(user);

    await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
      code: 'test',
      warehouse,
      creator: { id: 1 },
    });

    const response = await user.inject({
      method: 'GET',
      url: '/',
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: [
        {
          status: 'draft',
          creator: { fullName: 'tester tester' },
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it('should get outbound by id', async () => {
    const warehouse = await createSampleWarehouse();
    const product = await createSampleProduct();

    assert(app);
    assert(user);

    const outbound = await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
      code: 'test',
      warehouse,
      creator: { id: 1 },
    });

    await repo(OutboundProduct).save({
      outbound,
      product,
      quantity: 5,
    });

    const response = await user.inject({
      method: 'GET',
      url: '/1',
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        code: expect.any(String),
        products: [
          {
            id: 1,
            quantity: 5,
            product: {
              id: 1,
              name: 'test',
              // quantity: 10, // TODO(erfan)
              unit: {
                id: 1,
                name: 'unit',
              },
            },
            createdAt: expect.any(String),
          },
        ],
        creator: { id: 1, fullName: 'tester tester' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });
});

describe('Set CustomerId', () => {
  it('should set customer id when inbound state is draft', async () => {
    assert(app);
    assert(user);
    const warehouse = await createSampleWarehouse();
    const customer = await createSampleCustomer();

    const outbound = await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
      code: 'test',
      warehouse,
      creator: { id: 1 },
    });

    const response = await user.inject({
      method: 'POST',
      url: `/${outbound.id}/set-customer`,
      payload: {
        customerId: customer.id,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        customer: {
          id: customer.id,
        },
      },
    });
  });
});
