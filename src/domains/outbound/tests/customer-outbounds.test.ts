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
import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { describe } from 'node:test';
import 'reflect-metadata';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { WarehouseStaff } from '../../warehouse/models/WarehouseStaff';
import { Outbound, OutboundStatus, ReceiverType } from '../models/Outbound';
import routes from '../routes/customer-outbounds';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

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
    fiscalId: randomUUID(),
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

describe('Get Outbound of single customer', () => {
  it('should get list of outbounds', async () => {
    const warehouse = await createSampleWarehouse();
    const customerA = await createSampleCustomer();
    const customerB = await createSampleCustomer();

    assert(app);
    assert(user);

    await repo(Outbound).insert([
      {
        status: OutboundStatus.DRAFT,
        code: 'test',
        warehouse,
        creator: { id: 1 },
        receiverType: ReceiverType.CUSTOMER,
        receiverId: customerA.id,
      },
      {
        status: OutboundStatus.DRAFT,
        code: 'test2',
        warehouse,
        creator: { id: 1 },
        receiverType: ReceiverType.CUSTOMER,
        receiverId: customerB.id,
      },
    ]);

    const response = await user.inject({
      method: 'GET',
      url: `/customers/${customerA.id}/outbounds`,
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      data: [
        {
          status: 'draft',
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });
});
