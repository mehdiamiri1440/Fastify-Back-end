import 'reflect-metadata';

import { AppDataSource } from '$src/databases/typeorm';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
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

const sizeData = {
  title: 'big',
  length: '1',
  width: '2',
};
const propertyData = {
  title: 'normal',
};
const warehouseData = {
  name: 'DI Warehouse',
  province: 'P43',
  city: 'C43.183',
  street: 'S43.183.00057',
  postalCode: '43894',
  description: 'this is just for test',
};
const binData = {
  name: 'DI Bin',
  physicalCode: 'physicalCode',
  internalCode: 'internalCode',
};

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
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

  expect(response.statusCode).toBe(200);
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

  expect(response.statusCode).toBe(200);
});

it('should create a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/warehouses',
    payload: warehouseData,
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

it('should update a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/warehouses/' + warehouseId,
    payload: { ...warehouseData, name: 'edited' },
  });

  expect(response.statusCode).toBe(200);
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
        size: sizeId,
        property: propertyId,
        warehouse: warehouseId,
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

  expect(response.statusCode).toBe(200);
});

it('should delete a bin', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/bins/' + binId,
  });

  expect(response.statusCode).toBe(200);
});

it('should delete a warehouse', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/warehouses/' + warehouseId,
  });

  expect(response.statusCode).toBe(200);
});