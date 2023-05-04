import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import AppDataSource from '$src/DataSource';
import { Nationality } from './models/Nationality';
import { repo } from '$src/infra/utils/repo';

const Nationalities = repo(Nationality);
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let nId: number;
let customerId: number;
let contactId: number;
let documentId: number;

const customerData = {
  name: 'my name',
  businessName: 'my business name',
  subscriberType: 'empresa',
  documentType: 'dni',
  businessDocumentType: 'passaporte',
  fiscalId: 'my fiscal id',
  businessFiscalId: 'my buisness id',
  contactFamily1: 'my contact family one',
  contactFamily2: 'my contact family two',
  birthday: '2022-11-30T11:21:44.000-08:00',
  isActive: true,
};
const contactData = {
  name: 'Hanzou',
  surName: 'Jerald',
  position: 'CTO',
  email: 'hanzou@jerald.cto',
  phoneNumber: '+989303212233',
};
const addressData = {
  province: 'Fars',
  city: 'Shiraz',
  street: 'Hedayat',
  postalCode: '123456',
  number: 1,
  building: 'Prans',
  stairway: 'test',
  floor: '3',
  door: '7',
  latitude: 1.222334123,
  longitude: 2.222334124,
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

it('should return all nationalities', async () => {
  assert(app);
  assert(user);

  const ndata = await Nationalities.save({ title: 'SPN' });

  const response = await user.inject({
    method: 'GET',
    url: '/nationalities',
  });

  expect(response.json()).toMatchObject({
    data: [
      {
        ...ndata,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ],
    meta: {},
  });
  nId = ndata.id;
});

it('should create a customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/customers',
    payload: { ...customerData, nationality: nId },
  });

  expect(response.json()).toMatchObject({
    data: {
      ...customerData,
      nationality: { id: nId },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  customerId = response.json().data.id;
});

it('should return all customers', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: customerId,
        ...customerData,
        nationality: nId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update customer specification', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/specification',
    payload: { ...customerData, nationality: nId, name: 'edited' },
  });

  expect(response.statusCode).toBe(200);
});

it('should get customer specification', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/specification',
  });

  expect(response.json().data).toMatchObject(
    expect.objectContaining({
      id: customerId,
      ...customerData,
      name: 'edited',
      nationality: nId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    }),
  );
});

it('should create a contact for customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/customers/' + customerId + '/contacts',
    payload: { ...contactData },
  });

  expect(response.json()).toMatchObject({
    data: {
      ...contactData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  contactId = response.json().data.id;
});

it('should return all contact of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/contacts',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: contactId,
        ...contactData,
        customer: customerId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update a contact of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/contacts/' + contactId,
    payload: { ...contactData, name: 'edited' },
  });

  expect(response.statusCode).toBe(200);
});

it('should delete contact of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/customers/' + customerId + '/contacts/' + contactId,
  });

  expect(response.statusCode).toBe(200);
});

it('should create a document for customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/customers/' + customerId + '/documents',
    payload: { fileId: 'testFileId' },
  });

  expect(response.json()).toMatchObject({
    data: {
      fileId: 'testFileId',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  documentId = response.json().data.id;
});

it('should return all documents of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/documents',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: documentId,
        fileId: 'testFileId',
        customer: customerId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should delete document of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/customers/' + customerId + '/documents/' + documentId,
  });

  expect(response.statusCode).toBe(200);
});

it('should update customer address for first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/address',
    payload: { ...addressData },
  });

  expect(response.statusCode).toBe(200);
});

it('should get customer address', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/address',
  });

  expect(response.json()).toMatchObject({
    data: {
      ...addressData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should update customer address after first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/address',
    payload: { ...addressData, stairway: 'edited' },
  });

  expect(response.statusCode).toBe(200);
});
it('should update customer bank for first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/bank',
    payload: { iban: 'ES4920802421432544428435' },
  });

  expect(response.statusCode).toBe(200);
});

it('should get customer bank', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/bank',
  });

  expect(response.json()).toMatchObject({
    data: {
      iban: 'ES4920802421432544428435',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should update customer bank after first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/bank',
    payload: { iban: 'ES1600753513832862583447' },
  });

  expect(response.statusCode).toBe(200);
});

it('should not update customer bank', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/bank',
    payload: { iban: 'ES1600753513832862583448' },
  });

  expect(response.statusCode).toBe(400);
});

it('should delete customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/customers/' + customerId,
  });

  expect(response.statusCode).toBe(200);
});
