import 'reflect-metadata';

import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import {
  createTestFastifyApp,
  withoutForeignKeyCheck,
  TestUser,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { Language } from './models/Language';
import routes from './routes';
import { ProductSupplier } from '$src/domains/product/models/ProductSupplier';
import { Product } from '$src/domains/product/models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { SUPPLIER_SUPPLYING_OUR_PRODUCT } from '$src/domains/supplier/errors';
import { File } from '../files/models/File';

const Languages = repo(Language);
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const languageData = { title: 'SPN' };
const supplierData = {
  name: 'good supplier',
  cif: 'B12345678',
  iban: 'ES4930584005432720801245',
  email: 'good@supplier.sup',
  phoneNumber: '+989112223344',
  logoFileId: 'NO IDEA',
  accountNumber: '12345',
};
const contactData = {
  name: 'good',
  surName: 'contact',
  position: 'CEO',
  email: 'good@Suppliercontact.sup',
  phoneNumber: '+989112223344',
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

it('supplier flow', async () => {
  assert(app);
  assert(user);
  let languageId: number;
  let supplierId: number;
  let contactId: number;
  let documentId: number;
  const productId = await withoutForeignKeyCheck(async () => {
    return (
      await AppDataSource.getRepository(Product).save({
        name: 'name',
        code: 'code',
        barcode: 'barcode',
        invoiceSystemCode: 1,
        description: 'description',
        weight: 1,
      })
    ).id;
  });

  {
    // language
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
  }
  {
    // create supplier
    const response = await user.inject({
      method: 'POST',
      url: '/suppliers',
      payload: { ...supplierData, language: languageId },
    });
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        ...supplierData,
        language: languageData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    supplierId = response.json().data.id;
  }
  {
    // should return all products of supplier
    const ps = await AppDataSource.getRepository(ProductSupplier).save({
      supplier: { id: supplierId },
      product: { id: productId },
      creator: { id: 1 },
    });

    const response = await user.inject({
      method: 'GET',
      url: '/suppliers/' + supplierId + '/products',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          product: expect.objectContaining({ id: productId }),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
    await AppDataSource.getRepository(ProductSupplier).remove(ps);
  }
  {
    // should return all suppliers
    const response = await user.inject({
      method: 'GET',
      url: '/suppliers',
    });
    expect(response.json().data).toMatchObject([
      {
        id: supplierId,
        ...supplierData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  {
    // should single supplier
    const response = await user.inject({
      method: 'GET',
      url: '/suppliers/1',
    });
    expect(response.json().data).toMatchObject({
      id: supplierId,
      ...supplierData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
      language: {
        id: languageId,
      },
    });
  }
  {
    // should update supplier
    const response = await user.inject({
      method: 'PUT',
      url: '/suppliers/' + supplierId,
      payload: { ...supplierData, name: 'edited', language: languageId },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a contact for supplier
    const response = await user.inject({
      method: 'POST',
      url: '/suppliers/' + supplierId + '/contacts',
      payload: { ...contactData, supplier: supplierId },
    });
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        ...contactData,
        supplier: { id: supplierId },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    contactId = response.json().data.id;
  }
  {
    // should return all contacts of supplier
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
  }
  {
    // should update contact of supplier
    const response = await user.inject({
      method: 'PUT',
      url: '/suppliers/' + supplierId + '/contacts/' + contactId,
      payload: { ...contactData, name: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete contact of supplier
    const response = await user.inject({
      method: 'DELETE',
      url: '/suppliers/' + supplierId + '/contacts/' + contactId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a document for supplier

    await repo(File).save({
      id: 'testFileId.txt',
      bucketName: 'bucketName',
      mimetype: 'text/plain',
      originalName: 'original.txt',
      size: 100,
    });

    const response = await user.inject({
      method: 'POST',
      url: '/suppliers/' + supplierId + '/documents',
      payload: { fileId: 'testFileId.txt', supplier: supplierId },
    });
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        file: {
          id: 'testFileId.txt',
        },
        supplier: { id: supplierId },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    documentId = response.json().data.id;
  }
  {
    // should return all documents of supplier
    const response = await user.inject({
      method: 'GET',
      url: '/suppliers/' + supplierId + '/documents',
    });

    expect(response).statusCodeToBe(200);

    expect(response.json().data).toMatchObject([
      {
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
    // should delete document of supplier
    const response = await user.inject({
      method: 'DELETE',
      url: '/suppliers/' + supplierId + '/documents/' + documentId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete supplier
    const response = await user.inject({
      method: 'DELETE',
      url: '/suppliers/' + supplierId,
    });

    expect(response).statusCodeToBe(200);
  }
});

it('should not delete supplier if supplying any our products', async () => {
  assert(app);
  assert(user);
  const { supplier } = await withoutForeignKeyCheck(async () => {
    const supplier = await repo(Supplier).save({
      ...supplierData,
      language: { id: 1 },
      creator: { id: 1 },
    });
    await repo(ProductSupplier).save({
      supplier,
      product: { id: 1 },
      creator: { id: 1 },
    });
    return { supplier };
  });
  const response = await user.inject({
    method: 'DELETE',
    url: '/suppliers/' + supplier.id,
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(SUPPLIER_SUPPLYING_OUR_PRODUCT().code);
});
