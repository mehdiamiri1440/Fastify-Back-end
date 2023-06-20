import AppDataSource from '$src/DataSource';
import { Unit } from '$src/domains/configuration/models/Unit';
import { Customer } from '$src/domains/customer/models/Customer';
import '$src/infra/test/statusCodeExpect';
import {
  TestUser,
  createTestFastifyApp,
  withoutForeignKeyCheck,
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
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { randomUUID } from 'crypto';
import { DeepPartial } from 'typeorm';
import { CustomerContact } from '$src/domains/customer/models/Contact';

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
  const { warehouse } = await withoutForeignKeyCheck(async () => {
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
    return { warehouse };
  });

  return warehouse;
};

const createSampleCustomer = async () =>
  await withoutForeignKeyCheck(
    async () =>
      await repo(Customer).save({
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
      }),
  );

const createSampleCustomerWithContact = async () => {
  const customer = await createSampleCustomer();
  await repo(CustomerContact).save({
    customer,
    email: 'customer@email.com',
    phoneNumber: 'hey',
    creator: { id: 1 },
  });

  return customer;
};

const createSampleBin = async (
  warehouse: Warehouse,
  overrides?: DeepPartial<Bin>,
) =>
  await withoutForeignKeyCheck(
    async () =>
      await repo(Bin).save({
        name: 'bin1',
        warehouse,
        internalCode: randomUUID(),
        physicalCode: randomUUID(),
        property: { id: 1 },
        size: { id: 1 },
        creator: { id: 1 },
        ...overrides,
      }),
  );

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
          code: expect.stringContaining('OT'),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it('should get outbound by id', async () => {
    const warehouse = await createSampleWarehouse();

    assert(app);
    assert(user);

    await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
      warehouse,
      creator: { id: 1 },
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
        code: expect.stringContaining('OT'),
        creator: { id: 1, fullName: 'tester tester' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        warehouse: {
          id: warehouse.id,
        },
      },
    });
  });
});

describe('Get outbound products', () => {
  it('should get list of outbound products', async () => {
    const warehouse = await createSampleWarehouse();
    const product = await createSampleProduct();
    const bin = await createSampleBin(warehouse);

    assert(app);
    assert(user);

    await repo(BinProduct).save({
      product,
      bin,
      quantity: 25,
    });

    const outbound = await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
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
      url: `/${outbound.id}/products`,
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: [
        {
          quantity: 5,
          availableQuantity: 25,
          product: {
            name: product.name,
            unit: {
              name: product.unit.name,
            },
          },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it('should exclude bins from other warehouses when calculating the availableQuantity', async () => {
    const warehouse = await createSampleWarehouse();
    const warehouse2 = await createSampleWarehouse();
    const product = await createSampleProduct();
    const bin = await createSampleBin(warehouse);
    const bin2 = await createSampleBin(warehouse2);

    assert(app);
    assert(user);

    await repo(BinProduct).save({
      product,
      bin,
      quantity: 25,
    });

    await repo(BinProduct).save({
      product,
      bin: bin2,
      quantity: 25,
    });

    const outbound = await repo(Outbound).save({
      status: OutboundStatus.DRAFT,
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
      url: `/${outbound.id}/products`,
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: [
        {
          quantity: 5,
          availableQuantity: 25,
          product: {
            name: product.name,
            unit: {
              name: product.unit.name,
            },
          },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });
});

describe('Set receiver', () => {
  async function createOutbound() {
    const warehouse = await createSampleWarehouse();

    return repo(Outbound).save({
      status: OutboundStatus.DRAFT,
      warehouse,
      creator: { id: 1 },
    });
  }

  it('should set customer as receiver when inbound state is draft', async () => {
    assert(app);
    assert(user);
    const customer = await createSampleCustomerWithContact();
    const outbound = await createOutbound();

    const response = await user.inject({
      method: 'POST',
      url: `/${outbound.id}/set-receiver`,
      payload: {
        receiverType: 'customer',
        receiverId: customer.id,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        receiverType: 'customer',
        receiverId: customer.id,
      },
    });

    const outboundInfo = await user.inject({
      method: 'GET',
      url: `/${outbound.id}`,
    });

    expect(outboundInfo).statusCodeToBe(200);
    expect(outboundInfo.json().data).toMatchObject({
      receiver: {
        type: 'customer',
        typeId: customer.id,
        name: customer.name,
        email: 'customer@email.com',
      },
    });
  });

  it('should not set customer id when customerId is invalid', async () => {
    assert(app);
    assert(user);
    const outbound = await createOutbound();

    const response = await user.inject({
      method: 'POST',
      url: `/${outbound.id}/set-receiver`,
      payload: {
        receiverType: 'customer',
        receiverId: 16515,
      },
    });

    expect(response).statusCodeToBe(400);
    expect(response).errorCodeToBe('INVALID_CUSTOMER_ID');
  });

  it('should set user as receiver when inbound state is draft', async () => {
    assert(app);
    assert(user);
    const outbound = await createOutbound();

    const response = await user.inject({
      method: 'POST',
      url: `/${outbound.id}/set-receiver`,
      payload: {
        receiverType: 'user',
        receiverId: user.user.id,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: {
        id: 1,
        status: 'draft',
        receiverType: 'user',
        receiverId: user.user.id,
      },
    });

    const outboundInfo = await user.inject({
      method: 'GET',
      url: `/${outbound.id}`,
    });

    expect(outboundInfo).statusCodeToBe(200);
    expect(outboundInfo.json().data).toMatchObject({
      receiver: {
        type: 'user',
        typeId: user.id,
        name: user.user.fullName,
        email: user.user.email,
      },
    });
  });

  it('should not set user id when customerId is invalid', async () => {
    assert(app);
    assert(user);
    const outbound = await createOutbound();

    const response = await user.inject({
      method: 'POST',
      url: `/${outbound.id}/set-receiver`,
      payload: {
        receiverType: 'user',
        receiverId: 16515,
      },
    });

    expect(response).statusCodeToBe(400);
    expect(response).errorCodeToBe('INVALID_USER_ID');
  });
});
