import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { Nationality } from './models/Nationality';
import routes from './routes';
import '$src/infra/test/statusCodeExpect';
import { Customer } from '$src/domains/customer/models/Customer';
import { DeepPartial } from 'typeorm';
import { File } from '../files/models/File';

const Nationalities = repo(Nationality);
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const customerData = {
  name: 'my name',
  contactName: 'my business name',
  subscriberType: 'empresa',
  documentType: 'dni',
  contactDocumentType: 'passaporte',
  fiscalId: 'my fiscal id 123456',
  contactFiscalId: 'my buisness id',
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
  numberCode: 'blahblah.1',
  building: 'Prans',
  stairway: 'test',
  floor: '3',
  door: '7',
  latitude: 1.222334123,
  longitude: 2.222334124,
};

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
});

afterEach(async () => {
  await app?.close();
});

export function getCode(type: string, id: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counter = (id % 10000).toString().padStart(4, '0');
  return `${type}${date}${counter}`;
}

it('customer flow', async () => {
  assert(app);
  assert(user);
  let nId: number;
  let customerId: number;
  let contactId: number;
  let documentId: number;

  {
    // nationality
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
  }
  {
    // should create a customer
    const response = await user.inject({
      method: 'POST',
      url: '/customers',
      payload: { ...customerData, nationalityId: nId },
    });

    const result = response.json().data;

    expect(result).toMatchObject({
      ...customerData,
      code: getCode('CU', result.id),
      nationality: { id: nId },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
    customerId = response.json().data.id;
  }
  {
    // should update customer specification
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/specification',
      payload: { ...customerData, nationalityId: nId, name: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should get customer specification
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
  }
  {
    // should create a contact for customer
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
  }
  {
    // should return all contact of customer
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
  }
  {
    // should update a contact of customer
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/contacts/' + contactId,
      payload: { ...contactData, name: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete contact of customer
    const response = await user.inject({
      method: 'DELETE',
      url: '/customers/' + customerId + '/contacts/' + contactId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a document for customer

    await repo(File).save({
      id: 'testFileId.txt',
      bucketName: 'bucketName',
      mimetype: 'text/plain',
      originalName: 'original.txt',
      size: 100,
    });

    const response = await user.inject({
      method: 'POST',
      url: '/customers/' + customerId + '/documents',
      payload: { fileId: 'testFileId.txt' },
    });

    expect(response).statusCodeToBe(200);

    expect(response.json()).toMatchObject({
      data: {
        file: {
          id: 'testFileId.txt',
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    documentId = response.json().data.id;
  }
  {
    // should return all documents of customer
    const response = await user.inject({
      method: 'GET',
      url: '/customers/' + customerId + '/documents',
    });

    expect(response).statusCodeToBe(200);

    expect(response.json().data).toMatchObject([
      {
        id: documentId,
        file: {
          id: 'testFileId.txt',
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  {
    // should delete document of customer
    const response = await user.inject({
      method: 'DELETE',
      url: '/customers/' + customerId + '/documents/' + documentId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should update customer address for first time
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/address',
      payload: { ...addressData },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should get customer address
    const response = await user.inject({
      method: 'GET',
      url: '/customers/' + customerId + '/address',
    });

    expect(response.json()).toMatchObject({
      data: addressData,
      meta: {},
    });
  }
  {
    // should update customer address after first time
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/address',
      payload: { ...addressData, stairway: 'edited' },
    });

    expect(response).statusCodeToBe(200);

    expect(response.json().data).toMatchObject({
      stairway: 'edited',
    });
  }
  {
    // should update customer bank for first time
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/bank',
      payload: { iban: 'ES4920802421432544428435' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should get customer bank
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
  }
  {
    // should update customer bank after first time
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
  }
  {
    // should not update customer bank
    const response = await user.inject({
      method: 'PUT',
      url: '/customers/' + customerId + '/bank',
      payload: { iban: 'ES1600753513832862583448' },
    });

    expect(response).statusCodeToBe(400);
  }
  {
    // should return all customers
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
  }
  {
    // should return all customers - with address filter
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

    // search by fiscalId
    const response3 = await user.inject({
      method: 'GET',
      url: '/customers?filter.fiscalIdOrAddress.$like=%123%',
    });

    expect(response3).statusCodeToBe(200);
    expect(response3.json().data).toMatchObject([
      {
        fiscalId: 'my fiscal id 123456',
      },
    ]);
  }
  {
    // should delete customer
    const response = await user.inject({
      method: 'DELETE',
      url: '/customers/' + customerId,
    });

    expect(response).statusCodeToBe(200);
  }
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

it('should get subscriber types', async () => {
  assert(user);
  const response = await user.inject({
    method: 'GET',
    url: '/subscriber-types',
  });
  expect(response).statusCodeToBe(200);
  expect(response.json()).toMatchObject({
    data: expect.arrayContaining([expect.any(String)]),
    meta: {},
  });
});

it('should get document types', async () => {
  assert(user);
  const response = await user.inject({
    method: 'GET',
    url: '/document-types',
  });
  expect(response).statusCodeToBe(200);
  expect(response.json()).toMatchObject({
    data: expect.arrayContaining([expect.any(String)]),
    meta: {},
  });
});
