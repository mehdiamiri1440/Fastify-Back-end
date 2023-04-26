import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import AppDataSource from '$src/DataSource';
import { Language } from './models/Language';
import { repo } from '$src/infra/utils/repo';

const Languages = repo(Language);
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let languageId: number;
let supplierId: number;
let contactId: number;
let documentId: number;

const languageData = { title: 'SPN' };
const supplierData = {
  name: 'good supplier',
  cif: 'B12345678',
  language: 1,
  iban: 'ES4930584005432720801245',
  email: 'good@supplier.sup',
  phoneNumber: '+989112223344',
  logoFileId: 'NO IDEA',
  accountNumber: '12345',
  bic: 'CCRIES2A',
  bicName: 'CAJAMAR CAJA RURAL, S.C.C.',
};
const contactData = {
  name: 'good contact',
  position: 'CEO',
  email: 'good@Suppliercontact.sup',
  phoneNumber: '+989112223344',
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

it('should return all languages', async () => {
  assert(app);
  assert(user);

  languageId = (await Languages.save({ ...languageData })).id;

  const response = await user.inject({
    method: 'GET',
    url: '/languages',
  });
  expect(response.json()).toMatchObject({
    data: [
      {
        id: languageId,
        ...languageData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ],
    meta: {},
  });
});

it('should create a supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/suppliers',
    payload: supplierData,
  });
  supplierId = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: supplierId,
      ...supplierData,
      language: languageData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all suppliers', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/suppliers',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: supplierId,
        ...supplierData,
        language: languageId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/suppliers/' + supplierId,
    payload: { ...supplierData, name: 'edited' },
  });

  expect(response.statusCode).toBe(200);
});

it('should create a contact for supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/suppliers/' + supplierId + '/contacts',
    payload: { ...contactData, supplier: supplierId },
  });
  expect(response.json()).toMatchObject({
    data: {
      ...contactData,
      supplier: { id: supplierId },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  contactId = response.json().data.id;
});

it('should return all contacts of supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/suppliers/' + supplierId + '/contacts',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: contactId,
        ...contactData,
        supplier: supplierId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update contact of supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/suppliers/' + supplierId + '/contacts/' + contactId,
    payload: { ...contactData, name: 'edited' },
  });

  expect(response.statusCode).toBe(200);
});

it('should delete contact of supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/suppliers/' + supplierId + '/contacts/' + contactId,
  });

  expect(response.statusCode).toBe(200);
});

it('should create a document for supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/suppliers/' + supplierId + '/documents',
    payload: { fileId: 'testFileId', supplier: supplierId },
  });
  expect(response.json()).toMatchObject({
    data: {
      fileId: 'testFileId',
      supplier: { id: supplierId },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  documentId = response.json().data.id;
});

it('should return all documents of supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/suppliers/' + supplierId + '/documents',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: documentId,
        fileId: 'testFileId',
        supplier: supplierId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should delete document of supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/suppliers/' + supplierId + '/documents/' + documentId,
  });

  expect(response.statusCode).toBe(200);
});

it('should delete supplier', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/suppliers/' + supplierId,
  });

  expect(response.statusCode).toBe(200);
});
