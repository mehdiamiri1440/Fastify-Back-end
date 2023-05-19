import AppDataSource from '$src/DataSource';
import { User } from '$src/domains/user/models/User';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let sizeId: number;
let propertyId: number;
let warehouseId: number;
let binId: number;
let userId: number;
let staffId: number;

const sizeData = {
  title: 'big',
  width: 1,
  height: 2,
  depth: 3,
};
const propertyData = {
  title: 'normal',
};
const warehouseData = {
  name: 'DI Warehouse',
  provinceCode: 'P43',
  cityCode: 'C43.183',
  streetCode: 'S43.183.00057',
  streetName: 'Quatre',
  postalCode: '43894',
  description: 'this is just for test',
};
const binData = {
  name: 'DI Bin',
  physicalCode: 'physicalCode',
  internalCode: 'internalCode',
};
const userData = {
  firstName: 'Daniel',
  lastName: 'Soheil',
  nif: 'B-6116622G',
  email: 'daniel@sohe.ir',
  phoneNumber: '+989303590055',
  password: 'hackme',
  position: 'Developer',
  isActive: true,
};

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
  userId = (await repo(User).save({ ...userData })).id;
});

afterAll(async () => {
  await app?.close();
});

it('should create a bin size', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/bin-sizes',
    payload: sizeData,
  });
  sizeId = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: sizeId,
      ...sizeData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should get bin size by id', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bin-sizes/' + sizeId,
  });
  expect(response.json().data).toMatchObject({
    id: sizeId,
    ...sizeData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should get list of bin sizes', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bin-sizes/',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: sizeId,
        ...sizeData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a bin size', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/bin-sizes/' + sizeId,
    payload: { ...sizeData, title: 'edited' },
  });

  expect(response).statusCodeToBe(200);
});

it('should create a bin property', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/bin-properties',
    payload: propertyData,
  });
  propertyId = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: propertyId,
      ...propertyData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should get bin property by id', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bin-properties/' + propertyId,
  });
  expect(response.json().data).toMatchObject({
    id: propertyId,
    ...propertyData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should get list of bin properties', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bin-properties',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: propertyId,
        ...propertyData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a bin property', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/bin-properties/' + propertyId,
    payload: { ...propertyData, title: 'edited' },
  });

  expect(response).statusCodeToBe(200);
});

it('should create a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/warehouses',
    payload: { ...warehouseData, supervisor: userId },
  });
  warehouseId = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: warehouseId,
      ...warehouseData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should get list of warehouses', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouses',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: warehouseId,
        ...warehouseData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should get a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouses/' + warehouseId,
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject({
    id: warehouseId,
    ...warehouseData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should update a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/warehouses/' + warehouseId,
    payload: { ...warehouseData, supervisor: userId, name: 'edited' },
  });

  expect(response).statusCodeToBe(200);
});

it('should create a bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/bins',
    payload: {
      ...binData,
      size: sizeId,
      property: propertyId,
      warehouse: warehouseId,
    },
  });
  binId = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: binId,
      ...binData,
      size: { ...sizeData, title: 'edited' },
      property: { ...propertyData, title: 'edited' },
      warehouse: { ...warehouseData, name: 'edited' },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should get bin by id', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bins/' + binId,
  });
  expect(response.json().data).toMatchObject({
    id: binId,
    ...binData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should get list of bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/bins',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: binId,
        ...binData,
        size: expect.objectContaining({ id: sizeId }),
        property: expect.objectContaining({ id: propertyId }),
        warehouse: expect.objectContaining({ id: warehouseId }),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/bins/' + binId,
    payload: {
      ...binData,
      size: sizeId,
      property: propertyId,
      warehouse: warehouseId,
      name: 'edited',
    },
  });

  expect(response).statusCodeToBe(200);
});

it('should delete a bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/bins/' + binId,
  });

  expect(response).statusCodeToBe(200);
});

it('should delete bin property', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/bin-properties/' + propertyId,
  });

  expect(response).statusCodeToBe(200);
});

it('should delete bin size', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/bin-sizes/' + sizeId,
  });

  expect(response).statusCodeToBe(200);
});

it('check that our user is available for staff', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouse-staffs/available',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([expect.objectContaining(userData)]),
  );
});

it('should create a staff for warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/warehouse-staffs',
    payload: {
      user: userId,
      warehouse: warehouseId,
    },
  });
  expect(response.json()).toMatchObject({
    data: {
      user: { ...userData },
      warehouse: { ...warehouseData, name: 'edited' },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  staffId = response.json().data.id;
});

it('should not create a not available staff for warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/warehouse-staffs',
    payload: {
      user: userId,
      warehouse: warehouseId,
    },
  });
  expect(response.statusCode).not.toBe(200);
});

it('check that our user is not available for staff', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouse-staffs/available',
  });
  expect(response.json().data).not.toMatchObject(
    expect.arrayContaining([expect.objectContaining(userData)]),
  );
});

it('should get list staffs assigned to a warehouse', async () => {
  assert(app);
  assert(user);
  assert(staffId);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouse-staffs',
  });
  expect(response.json().data).toMatchObject([
    {
      id: staffId,
      user: { ...userData },
      warehouse: { ...warehouseData, name: 'edited' },
      creator: {},
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
  ]);
});

it('should delete a bin', async () => {
  assert(app);
  assert(user);
  assert(staffId);

  const response = await user.inject({
    method: 'DELETE',
    url: '/warehouse-staffs/' + staffId,
  });

  expect(response).statusCodeToBe(200);
});

it('should get empty list of staffs assigned to a warehouse', async () => {
  assert(app);
  assert(user);
  assert(staffId);

  const response = await user.inject({
    method: 'GET',
    url: '/warehouse-staffs',
  });
  expect(response.json().data).toMatchObject([]);
});

it('should not delete a bin', async () => {
  assert(app);
  assert(user);
  assert(staffId);

  const response = await user.inject({
    method: 'DELETE',
    url: '/warehouse-staffs/' + staffId,
  });

  expect(response.statusCode).not.toBe(200);
});

it('should delete a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/warehouses/' + warehouseId,
  });

  expect(response).statusCodeToBe(200);
});
