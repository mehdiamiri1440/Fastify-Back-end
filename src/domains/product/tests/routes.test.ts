import AppDataSource from '$src/DataSource';
import { Tag } from '$src/domains/configuration/models/Tag';
import { Unit } from '$src/domains/configuration/models/Unit';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import {
  TestUser,
  createTestFastifyApp,
  withoutForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { describe } from 'node:test';
import { BinProduct } from '../models/BinProduct';
import { Product } from '../models/Product';
import { ProductImage } from '../models/ProductImage';
import { ProductStockHistory, SourceType } from '../models/ProductStockHistory';
import { ProductSupplier } from '../models/ProductSupplier';
import { Size } from '../models/Size';
import { TaxType } from '../models/TaxType';
import routes from '../routes';
import { InboundProduct } from '$src/domains/inbound/models/InboundProduct';
import {
  Inbound,
  InboundStatus,
  InboundType,
} from '$src/domains/inbound/models/Inbound';
import { DeepPartial } from 'typeorm';
import '$src/infra/test/statusCodeExpect';
import { Category } from '$src/domains/configuration/models/Category';
import '$src/infra/test/statusCodeExpect';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let warehouse: Warehouse | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);

  await withoutForeignKeyCheck(async () => {
    warehouse = await repo(Warehouse).save({
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
  });
});

afterEach(async () => {
  await app?.close();
});

export function getCode(type: string, id: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counter = (id % 10000).toString().padStart(4, '0');
  return `${type}${date}${counter}`;
}

const createSampleProduct = async (overrides?: DeepPartial<Product>) =>
  await withoutForeignKeyCheck(
    async () =>
      await repo(Product).save({
        name: 'product 1',
        barcode: '123',
        invoiceSystemCode: 1,
        description: 'description',
        weight: 1,
        unit: await repo(Unit).save({
          id: 1,
          name: 'meter',
          creator: { id: 1 },
        }),
        creator: { id: 1 },
        ...overrides,
      }),
  );

const createSampleSupplier = async (overrides?: DeepPartial<Supplier>) =>
  await withoutForeignKeyCheck(
    async () =>
      await repo(Supplier).save({
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
        ...overrides,
      }),
  );

it('POST /products should be working', async () => {
  assert(user);
  const response = await user.inject({
    method: 'POST',
    url: `/products`,
    payload: {
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      unitId: (
        await repo(Unit).save({
          id: 1,
          name: 'meter',
          creator: { id: 1 },
        })
      ).id,
      categoryId: (
        await repo(Category).save({
          id: 1,
          name: 'test',
          creator: { id: 1 },
        })
      ).id,
    },
  });

  expect(response).statusCodeToBe(200);
  expect(response?.json().data).toMatchObject({
    name: 'product 1',
    code: getCode('PR', 1),
    barcode: '123',
    invoiceSystemCode: 1,
    description: 'description',
    weight: 1,
    unit: { id: 1, name: 'meter' },
  });
});

it('GET /products/:id should be working', async () => {
  assert(user);
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();
  // const bin = await createSampleBin();

  await repo(ProductImage).insert([
    {
      product,
      fileId: 'file1.png',
    },
    {
      product,
      fileId: 'file2.png',
    },
  ]);

  await repo(Product).save(product);

  await withoutForeignKeyCheck(
    async () =>
      await repo(ProductSupplier).save({
        product,
        supplier,
        creator: {
          id: 1,
        },
      }),
  );

  const response = await user.inject({
    method: 'GET',
    url: `/products/${product.id}`,
  });

  expect(response).statusCodeToBe(200);
  expect(response?.json().data).toMatchObject({
    images: [
      {
        id: expect.any(Number),
        fileId: 'file1.png',
      },
      {
        id: expect.any(Number),
        fileId: 'file2.png',
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
  });
});

it('POST /products/:id/suppliers should be working', async () => {
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();

  const response = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/suppliers`,
    payload: {
      supplierId: supplier.id,
    },
  });

  expect(response).statusCodeToBe(200);

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
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();

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
  const product = await createSampleProduct();
  const supplier = await createSampleSupplier();

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
  const product = await createSampleProduct();

  const createResponse = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/images`,
    payload: {
      fileId: 'file1.png',
    },
  });
  expect(createResponse).statusCodeToBe(200);

  const images = await repo(ProductImage).find({
    loadRelationIds: {
      disableMixedMap: true,
    },
  });
  expect(images.length).toBe(1);
  expect(images[0]).toMatchObject({
    product: {
      id: product.id,
    },
    fileId: 'file1.png',
  });
});

it('POST /products/:id/move-bin-quantity', async () => {
  assert(user);
  const product = await createSampleProduct();
  const { sourceBin, targetBin } = await withoutForeignKeyCheck(async () => {
    const sourceBin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      size: { id: 1 },
      property: { id: 1 },
      creator: { id: 1 },
    });

    const targetBin = await repo(Bin).save({
      name: 'bin2',
      warehouse,
      size: { id: 1 },
      property: { id: 1 },
      internalCode: 'hey2',
      creator: { id: 1 },
    });

    await repo(BinProduct).save({
      bin: sourceBin,
      product,
      quantity: 10,
      creator: { id: 1 },
    });
    return { sourceBin, targetBin };
  });

  const response = await user?.inject({
    method: 'POST',
    url: `/products/${product.id}/move-bin-quantity`,
    payload: {
      sourceBinId: sourceBin.id,
      targetBinId: targetBin.id,
      quantity: 5,
    },
  });
  expect(response).statusCodeToBe(200);

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

    const product = await createSampleProduct();
    const otherProduct = await createSampleProduct();

    const { bin } = await withoutForeignKeyCheck(async () => {
      const bin = await repo(Bin).save({
        name: 'bin1',
        warehouse,
        internalCode: 'hey1',
        size: { id: 1 },
        property: { id: 1 },
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
      return { bin };
    });

    const response = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/history`,
    });
    expect(response).statusCodeToBe(200);
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
  it('GET /bins/:id/history should be working', async () => {
    assert(user);
    const product = await createSampleProduct();

    const otherProduct = await createSampleProduct();

    const { bin } = await withoutForeignKeyCheck(async () => {
      const bin = await repo(Bin).save({
        name: 'bin1',
        warehouse,
        internalCode: 'hey1',
        size: { id: 1 },
        property: { id: 1 },
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
      return { bin };
    });

    const response = await user.inject({
      method: 'GET',
      url: `/bins/${bin.id}/history`,
    });
    expect(response).statusCodeToBe(200);
    expect(response?.json().data).toMatchObject([
      {
        quantity: 30,
        sourceType: 'outbound',
        creator: {
          id: 1,
          fullName: 'tester tester',
        },
        product: {
          id: otherProduct.id,
          name: otherProduct.name,
        },
        createdAt: expect.any(String),
      },
      {
        quantity: 20,
        sourceType: 'outbound',
        creator: {
          id: 1,
          fullName: 'tester tester',
        },
        product: {
          id: product.id,
          name: product.name,
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
        product: {
          id: product.id,
          name: product.name,
        },
        createdAt: expect.any(String),
      },
    ]);
  });
});

describe('bins', () => {
  it('GET /products/:id/bins should be working', async () => {
    assert(user);
    assert(warehouse);

    const product = await createSampleProduct();

    const { binProductA, binProductB } = await withoutForeignKeyCheck(
      async () => {
        const binProductA = await repo(BinProduct).save({
          bin: await repo(Bin).save({
            name: 'bin1',
            warehouse,
            internalCode: 'hey1',
            size: { id: 1 },
            property: { id: 1 },
            creator: { id: 1 },
          }),
          product,

          quantity: 10,
          creator: { id: 1 },
        });

        const binProductB = await repo(BinProduct).save({
          bin: await repo(Bin).save({
            name: 'bin2',
            warehouse,
            internalCode: 'hey2',
            size: { id: 1 },
            property: { id: 1 },
            creator: { id: 1 },
          }),
          product,
          quantity: 30,
          creator: { id: 1 },
        });
        return { binProductA, binProductB };
      },
    );

    const response = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/bins`,
    });

    expect(response).statusCodeToBe(200);
    const body = await response?.json().data;

    expect(body).toHaveLength(2);
    expect(body).toMatchObject([
      {
        id: binProductA.id,
        bin: {
          id: binProductA.bin.id,
          name: binProductA.bin.name,
          warehouse: {
            id: expect.any(Number),
            name: warehouse.name,
          },
        },
        unit: {
          name: 'meter',
        },
      },
      {
        id: binProductB.id,
        bin: {
          id: binProductB.bin.id,
          name: binProductB.bin.name,
          warehouse: {
            id: expect.any(Number),
            name: warehouse.name,
          },
        },
        unit: {
          name: 'meter',
        },
      },
    ]);
  });
  it('GET /bins/:id/products should be working', async () => {
    assert(user);
    assert(warehouse);

    const { bin, binProductA, binProductB } = await withoutForeignKeyCheck(
      async () => {
        const bin = await repo(Bin).save({
          name: 'bin',
          warehouse,
          internalCode: 'hey2',
          size: { id: 1 },
          property: { id: 1 },
          creator: { id: 1 },
        });

        const binProductA = await repo(BinProduct).save({
          bin,
          product: await createSampleProduct(),

          quantity: 10,
          creator: { id: 1 },
        });

        const binProductB = await repo(BinProduct).save({
          bin,
          product: await createSampleProduct(),
          quantity: 30,
          creator: { id: 1 },
        });
        return { bin, binProductA, binProductB };
      },
    );

    const response = await user.inject({
      method: 'GET',
      url: `/bins/${bin.id}/products`,
    });

    expect(response).statusCodeToBe(200);
    const body = await response?.json().data;

    expect(body).toHaveLength(2);
    expect(body).toMatchObject([
      {
        id: binProductA.id,
        product: {
          id: binProductA.product.id,
          name: binProductA.product.name,
        },
      },
      {
        id: binProductB.id,
        product: {
          id: binProductB.product.id,
          name: binProductB.product.name,
        },
      },
    ]);
  });
});

describe('tax types', () => {
  it('GET /tax-types should be working', async () => {
    assert(user);

    await repo(TaxType).insert([
      {
        title: 'tt1',
        creator: { id: 1 },
      },
      {
        title: 'tt2',
        creator: { id: 1 },
      },
    ]);

    const response = await user.inject({
      method: 'GET',
      url: `/tax-types`,
    });

    expect(response).statusCodeToBe(200);
    expect(response?.json().data).toHaveLength(2);
    expect(response?.json().data).toMatchObject([
      {
        id: 1,
        title: 'tt1',
      },
      {
        id: 2,
        title: 'tt2',
      },
    ]);
  });
});

describe('sizes', () => {
  it('GET /sizes should be working', async () => {
    assert(user);

    await repo(Size).insert([
      {
        title: 'tt1',
        width: 10,
        height: 10,
        creator: { id: 1 },
      },
      {
        title: 'tt2',
        width: 10,
        height: 10,
        creator: { id: 1 },
      },
    ]);

    const response = await user.inject({
      method: 'GET',
      url: `/sizes`,
    });

    expect(response).statusCodeToBe(200);
    expect(response?.json().data).toHaveLength(2);
    expect(response?.json().data).toMatchObject([
      {
        id: 1,
        width: 10,
        height: 10,
        title: 'tt1',
      },
      {
        id: 2,
        width: 10,
        height: 10,
        title: 'tt2',
      },
    ]);
  });
});

describe('inbounds', () => {
  it('GET /products/:id/inbounds should be working', async () => {
    assert(user);

    const product = await createSampleProduct();
    const supplier = await createSampleSupplier();

    const inbound = await repo(Inbound).save({
      type: InboundType.NEW,
      status: InboundStatus.SORTED,
      creator: {
        id: 1,
      },
      warehouse,
    });

    await repo(InboundProduct).insert([
      {
        supplier,
        product,
        inbound,
        price: 100,
        requestedQuantity: 10,
        actualQuantity: 10,
      },
      {
        supplier,
        product,
        inbound,
        price: 200,
        requestedQuantity: 20,
        actualQuantity: 21,
      },
    ]);

    const response = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/inbounds`,
    });

    expect(response).statusCodeToBe(200);
    const body = await response?.json().data;

    expect(body).toHaveLength(2);
    expect(body[0]).toMatchObject({
      createdAt: expect.any(String),
      supplier: {
        id: supplier.id,
        name: supplier.name,
      },
      price: 200,
      actualQuantity: 21,
    });
  });
});

describe('Search', () => {
  it('GET /products/search should be working', async () => {
    assert(user);
    await createSampleProduct({ name: 'abcdef', description: 'iPhone 11 pro' });
    await createSampleProduct({ name: 'def', description: 'Samsung 13 pro' });

    const response = await user.inject({
      method: 'GET',
      url: `/products/search?q=${encodeURIComponent('def 13')}`,
    });

    expect(response).statusCodeToBe(200);
    expect(response?.json().data).toMatchObject([
      {
        name: 'def',
        description: 'Samsung 13 pro',
      },
    ]);
  });
});

describe('Suppliers', () => {
  describe('Search', () => {
    const initData = async () => {
      const p1 = await createSampleProduct();
      const p2 = await createSampleProduct();
      const s1 = await createSampleSupplier();
      const s2 = await createSampleSupplier({ name: 'hey' });

      await withoutForeignKeyCheck(async () => {
        await repo(ProductSupplier).save({
          product: p1,
          supplier: s1,
          creator: { id: 1 },
        });

        await repo(ProductSupplier).save({
          product: p2,
          supplier: s2,
          creator: { id: 1 },
        });

        await repo(ProductSupplier).save({
          product: p2,
          supplier: s1,
          creator: { id: 1 },
        });
      });

      return {
        s1,
        s2,
        p1,
        p2,
      };
    };

    it('GET /products/:id/free-to-add-suppliers should be working', async () => {
      assert(user);
      const { s2, p1 } = await initData();

      const response = await user.inject({
        method: 'GET',
        url: `/products/${p1.id}/free-to-add-suppliers`,
      });

      expect(response).statusCodeToBe(200);
      expect(response.json().data).toMatchObject([
        {
          id: s2.id,
          name: s2.name,
        },
      ]);
    });

    it('GET /products/:id/free-to-add-suppliers should be working with search', async () => {
      assert(user);
      const { s2, p1 } = await initData();

      const response = await user.inject({
        method: 'GET',
        url: `/products/${p1.id}/free-to-add-suppliers?search=hev`,
      });

      expect(response).statusCodeToBe(200);
      expect(response.json().data).toMatchObject([]);

      const response2 = await user.inject({
        method: 'GET',
        url: `/products/${p1.id}/free-to-add-suppliers?search=hey`,
      });

      expect(response2).statusCodeToBe(200);
      expect(response2.json().data).toMatchObject([
        {
          id: s2.id,
          name: s2.name,
        },
      ]);
    });
  });
});

describe('Content', async () => {
  it('GET and PUT of /products/:id/content should be working', async () => {
    assert(user);
    const product = await createSampleProduct();

    const { identifiers: tags } = await repo(Tag).insert([
      {
        name: 'tag1',
        creator: { id: 1 },
      },
      {
        name: 'tag2',
        creator: { id: 1 },
      },
      {
        name: 'tag3',
        creator: { id: 1 },
      },
    ]);

    const emptyContentResponse = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/content`,
    });
    expect(emptyContentResponse).statusCodeToBe(200);
    expect(emptyContentResponse.json().data).toMatchObject({
      id: product.id,
      content: null,
      tags: [],
    });

    await user.inject({
      method: 'PUT',
      url: `/products/${product.id}/content`,
      payload: {
        content: 'content',
        tagIds: [tags[0].id, tags[1].id],
      },
    });

    const contentResponse = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/content`,
    });
    expect(contentResponse).statusCodeToBe(200);
    expect(contentResponse.json().data).toMatchObject({
      id: product.id,
      content: 'content',
      tags: [
        {
          id: tags[0].id,
          name: 'tag1',
        },
        {
          id: tags[1].id,
          name: 'tag2',
        },
      ],
    });
  });
});

describe('Sale Price', () => {
  it('GET and POST /products/:id/sale-prices should be working', async () => {
    assert(user);
    const product = await createSampleProduct();

    const createResponse = await user.inject({
      method: 'POST',
      url: `/products/${product.id}/sale-prices`,
      payload: {
        price: 150,
      },
    });

    expect(createResponse).statusCodeToBe(200);

    const listResponse = await user.inject({
      method: 'GET',
      url: `/products/${product.id}/sale-prices`,
    });

    expect(listResponse).statusCodeToBe(200);
    expect(listResponse.json().data).toMatchObject([
      {
        id: 1,
        price: 150,
        createdAt: expect.any(String),
      },
    ]);
  });
});
