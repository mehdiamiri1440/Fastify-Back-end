import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { Nationality } from './models/Nationality';
import routes from './routes';
import '$src/infra/test/statusCodeExpect';
import { Customer } from '$src/domains/customer/models/Customer';
import { DeepPartial } from 'typeorm';

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
} as DeepPartial<Customer>;
const contactData = {
  name: 'Hanzou',
  surName: 'Jerald',
  position: 'CTO',
  email: 'hanzou@jerald.cto',
  phoneNumber: '+989303212233',
};
const addressData = {
  provinceName: 'Fars',
  provinceCode: 'Fars',
  cityName: 'Shiraz',
  cityCode: 'Shiraz',
  streetName: 'Hedayat',
  streetCode: 'Hedayat',
  postalCode: '123456',
  number: '1',
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
    payload: { ...customerData, nationalityId: nId },
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

it('should update customer specification', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/specification',
    payload: { ...customerData, nationalityId: nId, name: 'edited' },
  });

  expect(response).statusCodeToBe(200);
});

it('should get customer specification', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/specification',
  });

  expect(response).statusCodeToBe(200);

  expect(response.json().data).toMatchObject({
    id: customerId,
    ...customerData,
    name: 'edited',
    nationality: {
      id: nId,
      title: expect.any(String),
    },
    creator: {
      id: expect.any(Number),
      fullName: expect.any(String),
    },
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
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

  expect(response).statusCodeToBe(200);

  expect(response.json().data).toMatchObject([
    {
      id: contactId,
      ...contactData,
      customer: customerId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
  ]);
});

it('should update a contact of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/contacts/' + contactId,
    payload: { ...contactData, name: 'edited' },
  });

  expect(response).statusCodeToBe(200);
});

it('should delete contact of customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/customers/' + customerId + '/contacts/' + contactId,
  });

  expect(response).statusCodeToBe(200);
});

it('should create a document for customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/customers/' + customerId + '/documents',
    payload: { fileId: 'testFileId' },
  });

  expect(response).statusCodeToBe(200);

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

  expect(response).statusCodeToBe(200);

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

  expect(response).statusCodeToBe(200);
});

it('should update customer address for first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/address',
    payload: { ...addressData },
  });

  expect(response).statusCodeToBe(200);
});

it('should get customer address', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers/' + customerId + '/address',
  });

  expect(response.json()).toMatchObject({
    data: addressData,
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

  expect(response).statusCodeToBe(200);

  expect(response.json().data).toMatchObject({
    stairway: 'edited',
  });
});
it('should update customer bank for first time', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/bank',
    payload: { iban: 'ES4920802421432544428435' },
  });

  expect(response).statusCodeToBe(200);
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

  expect(response).statusCodeToBe(200);

  expect(response.json().data).toMatchObject({
    id: expect.any(Number),
    iban: 'ES1600753513832862583447',
    bankName: expect.any(String),
    bic: expect.any(String),
  });
});

it('should not update customer bank', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + customerId + '/bank',
    payload: { iban: 'ES1600753513832862583448' },
  });

  expect(response).statusCodeToBe(400);
});

it('should return all customers', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers',
  });

  expect(response).statusCodeToBe(200);

  expect(response.json().data).toMatchObject([
    {
      id: customerId,
      ...customerData,
      name: 'edited',
      nationality: {
        id: nId,
        title: expect.any(String),
      },
      address: {
        ...addressData,
        stairway: 'edited',
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
  ]);
});

it('should return all customers - with address filter', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/customers?filter.fiscalIdOrAddress.$like=%Shiraz%',
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject([
    {
      id: customerId,
    },
  ]);

  const response2 = await user.inject({
    method: 'GET',
    url: '/customers?filter.fiscalIdOrAddress.$like=%Hey%',
  });

  expect(response2).statusCodeToBe(200);
  expect(response2.json().data).toMatchObject([]);
});

it('should delete customer', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/customers/' + customerId,
  });

  expect(response).statusCodeToBe(200);
});

it('should deactive customer', async () => {
  assert(app);
  assert(user);
  const { id } = await repo(Customer).save({
    ...customerData,
    nationality: await Nationalities.save({
      title: 'xzcv',
      creator: { id: 1 },
    }),
    isActive: true,
    creator: { id: 1 },
  });

  const response = await user.inject({
    method: 'PUT',
    url: '/customers/' + id + '/is-active',
    payload: {
      isActive: false,
    },
  });

  expect(response).statusCodeToBe(200);
  const newCustomer = await repo(Customer).findOneByOrFail({ id });
  expect(newCustomer.isActive).toBe(false);
});
