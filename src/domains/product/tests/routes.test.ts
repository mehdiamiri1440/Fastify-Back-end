import AppDataSource from '$src/DataSource';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import {
  TestUser,
  createTestFastifyApp,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { expect, it, beforeEach, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import routes from '../routes';
import { Product } from '../models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { ProductSupplier } from '../models/ProductSupplier';
import { ProductImage } from '../models/ProductImage';
import assert from 'assert';
import { P } from 'pino';
import { BinProduct } from '../models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Tag } from '$src/domains/configuration/models/Tag';
import { describe } from 'node:test';
import { ProductStockHistory, SourceType } from '../models/ProductStockHistory';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let warehouse: Warehouse | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  await disableForeignKeyCheck();

  warehouse = await repo(Warehouse).save({
    name: 'warehouse test',
    description: 'description',
    postalCode: 'postalCode',
    province: 'province',
    city: 'city',
    street: 'street',
    creator: {
      id: 1,
    },
  });

  await enableForeignKeyCheck();
});

afterEach(async () => {
  await app?.close();
});

const createSampleProduct = async () =>
  await repo(Product).save({
    name: 'product 1',
    barcode: '123',
    invoiceSystemCode: 1,
    description: 'description',
    weight: 1,
    creator: { id: 1 },
  });

const createSampleSupplier = async () =>
  repo(Supplier).save({
    name: 'test',
    cif: 'cif',
    iban: 'iban',
    email: 'email',
    phoneNumber: 'phone',
    accountNumber: 'account',
    language: {
      id: 1,
    },
    creator: {
      id: 1,
    },
  });

const createSampleBin = () =>
  repo(Bin).save({
    name: 'bin1',
    warehouse,
    internalCode: 'hey1',
    creator: { id: 1 },
  });

it('GET /products/:id should be working', async () => {
  assert(user);
  await disableForeignKeyCheck();

  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();
  // const bin = await createSampleBin();

  await repo(ProductImage).save({
    product,
    fileId: 'file1.png',
  });

  await repo(ProductSupplier).save({
    product,
    supplier,
    creator: {
      id: 1,
    },
  });

  const tag = await repo(Tag).save({
    name: 'tag',
  });

  product.tags = [tag];

  await repo(Product).save(product);

  // await repo(BinProduct).save({
  //   bin,
  //   product,
  // });

  await enableForeignKeyCheck();

  const response = await user.inject({
    method: 'GET',
    url: `/products/${product.id}`,
  });

  expect(response?.statusCode).toBe(200);
  expect(response?.json().data).toMatchObject({
    images: [
      {
        fileId: 'file1.png',
      },
    ],
    productSuppliers: [
      {
        id: 1,
        supplier: {
          id: 1,
          name: supplier.name,
        },
      },
    ],
    tags: [
      {
        id: tag.id,
        name: tag.name,
      },
    ],
  });
});

it('POST /products/:id/suppliers should be working', async () => {
  await disableForeignKeyCheck();

  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();

  await enableForeignKeyCheck();

  const response = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/suppliers`,
    payload: {
      supplierId: supplier.id,
    },
  });

  expect(response?.statusCode).toBe(200);

  const supplierProducts = await repo(ProductSupplier).find({
    loadRelationIds: {
      disableMixedMap: true,
    },
  });
  expect(supplierProducts.length).toBe(1);
  expect(supplierProducts[0]).toMatchObject({
    supplier: {
      id: supplier.id,
    },
    product: {
      id: product.id,
    },
  });
});

it('DELETE /product-suppliers/:id should be working', async () => {
  await disableForeignKeyCheck();
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();
  await enableForeignKeyCheck();

  const createResponse = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/suppliers`,
    payload: {
      supplierId: supplier.id,
    },
  });

  expect(createResponse?.statusCode).toBe(200);
  const createResult = await createResponse?.json();

  const deleteResponse = await user?.inject({
    method: 'DELETE',
    url: `/product-suppliers/${createResult.data.id}`,
  });

  expect(deleteResponse?.statusCode).toBe(200);

  const supplierProducts = await repo(ProductSupplier).find({
    loadRelationIds: {
      disableMixedMap: true,
    },
  });
  expect(supplierProducts.length).toBe(0);
});

it('PUT /product-suppliers/:id should be working', async () => {
  await disableForeignKeyCheck();
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();
  await enableForeignKeyCheck();

  const createResponse = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/suppliers`,
    payload: {
      supplierId: supplier.id,
    },
  });

  expect(createResponse?.statusCode).toBe(200);
  const createResult = await createResponse?.json();

  const deleteResponse = await user?.inject({
    method: 'PUT',
    url: `/product-suppliers/${createResult.data.id}`,
    payload: {
      referenceCode: 'ref1',
    },
  });

  expect(deleteResponse?.statusCode).toBe(200);

  const supplierProducts = await repo(ProductSupplier).find({
    loadRelationIds: {
      disableMixedMap: true,
    },
  });
  expect(supplierProducts.length).toBe(1);
  expect(supplierProducts[0]).toMatchObject({
    referenceCode: 'ref1',
  });
});

it('POST /products/:id/images should be working', async () => {
  await disableForeignKeyCheck();
  const product = await createSampleProduct();
  await enableForeignKeyCheck();

  const createResponse = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/images`,
    payload: {
      fileId: 'file1.png',
    },
  });
  expect(createResponse?.statusCode).toBe(200);

  const images = await repo(ProductImage).find({
    loadRelationIds: {
      disableMixedMap: true,
    },
  });
  expect(images.length).toBe(1);
  expect(images[0]).toMatchObject({
    fileId: 'file1.png',
  });
});

it('POST /products/:id/move-bin-quantity', async () => {
  assert(user);
  await disableForeignKeyCheck();

  const product = await createSampleProduct();

  const sourceBin = await repo(Bin).save({
    name: 'bin1',
    warehouse,
    internalCode: 'hey1',
    creator: { id: 1 },
  });

  const targetBin = await repo(Bin).save({
    name: 'bin2',
    warehouse,
    internalCode: 'hey2',
    creator: { id: 1 },
  });

  await repo(BinProduct).save({
    bin: sourceBin,
    product,
    quantity: 10,
    creator: { id: 1 },
  });

  await enableForeignKeyCheck();

  const response = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/move-bin-quantity`,
    payload: {
      sourceBinId: sourceBin.id,
      targetBinId: targetBin.id,
      quantity: 5,
    },
  });
  expect(response?.statusCode).toBe(200);

  const sourceBinProduct = await repo(BinProduct).findOne({
    where: {
      bin: {
        id: sourceBin.id,
      },
      product: {
        id: product.id,
      },
    },
  });

  expect(sourceBinProduct?.quantity).toBe(5);
});

describe('history', () => {
  it('GET /products/:id/history should be working', async () => {
    assert(user);
    await disableForeignKeyCheck();

    const product = await createSampleProduct();
    const otherProduct = await createSampleProduct();

    const bin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });

    await repo(ProductStockHistory).insert([
      {
        product,
        quantity: 10,
        bin,
        sourceType: SourceType.INBOUND,
        sourceId: null,
        description: 'test',
        creator: { id: 1 },
      },
      {
        product,
        quantity: 20,
        bin,
        sourceType: SourceType.OUTBOUND,
        sourceId: null,
        description: 'test',
        creator: { id: 1 },
      },
      {
        product: otherProduct,
        quantity: 30,
        bin,
        sourceType: SourceType.OUTBOUND,
        sourceId: null,
        description: 'test',
        creator: { id: 1 },
      },
    ]);

    await enableForeignKeyCheck();

    const response = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/history`,
    });
    expect(response?.statusCode).toBe(200);
    expect(response?.json().data).toMatchObject([
      {
        quantity: 20,
        sourceType: 'outbound',
        creator: {
          id: 1,
          fullName: 'tester tester',
        },
        bin: {
          id: bin.id,
          name: bin.name,
        },
        createdAt: expect.any(String),
      },
      {
        quantity: 10,
        sourceType: 'inbound',
        creator: {
          id: 1,
          fullName: 'tester tester',
        },
        bin: {
          id: bin.id,
          name: bin.name,
        },
        createdAt: expect.any(String),
      },
    ]);
  });
});
