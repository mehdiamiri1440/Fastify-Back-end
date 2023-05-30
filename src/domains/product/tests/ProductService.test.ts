import AppDataSource from '$src/DataSource';
import { Bin } from '$src/domains/warehouse/models/Bin';
import {
  createTestFastifyApp,
  createTestUser,
  disableForeignKeyCheck,
  enableForeignKeyCheck,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import { describe } from 'node:test';
import 'reflect-metadata';
import { Warehouse } from '../../warehouse/models/Warehouse';
import { ProductService } from '../ProductService';
import { BinProduct } from '../models/BinProduct';
import { Product } from '../models/Product';
import { ProductStockHistory, SourceType } from '../models/ProductStockHistory';

let warehouse: Warehouse | undefined;

beforeEach(async () => {
  await createTestFastifyApp();
  await AppDataSource.synchronize();
  await createTestUser();
  await disableForeignKeyCheck();

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

  await enableForeignKeyCheck();
});

afterEach(async () => {
  await AppDataSource.destroy();
});

describe('addProductToBin', () => {
  it('should create a new BinProduct if it does not exist', async () => {
    const productService = new ProductService(AppDataSource, 1);

    await disableForeignKeyCheck();

    const product = await repo(Product).save({
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      creator: { id: 1 },
    });

    const bin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });

    await enableForeignKeyCheck();

    await productService.addProductToBin({
      product,
      bin,
      quantity: 10,
      sourceType: SourceType.INBOUND,
      sourceId: 155,
      description: 'Test description',
    });

    const binProduct = await repo(BinProduct).findOne({
      where: {
        bin: {
          id: bin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    expect(binProduct?.quantity).toBe(10);

    const stockHistory = await repo(ProductStockHistory).findOne({
      where: {
        product: {
          id: product.id,
        },
        bin: {
          id: bin.id,
        },
        sourceType: SourceType.INBOUND,
        sourceId: 155,
        description: 'Test description',
      },
    });

    expect(stockHistory).toMatchObject({
      sourceType: SourceType.INBOUND,
      sourceId: 155,
      description: 'Test description',
      quantity: 10,
    });
  });

  it('should update existing BinProduct quantity', async () => {
    const productService = new ProductService(AppDataSource, 1);

    await disableForeignKeyCheck();

    const product = await repo(Product).save({
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      creator: { id: 1 },
    });

    const bin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });

    await repo(BinProduct).save({
      bin,
      product,
      quantity: 5,
      creator: { id: 1 },
    });

    await enableForeignKeyCheck();

    await productService.addProductToBin({
      product,
      bin,
      quantity: 10,
      sourceType: SourceType.INBOUND,
      sourceId: 155,
      description: 'Test description',
    });

    const binProduct = await repo(BinProduct).findOne({
      where: {
        bin: {
          id: bin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    expect(binProduct?.quantity).toBe(15);

    const stockHistory = await repo(ProductStockHistory).find({
      where: {
        product: {
          id: product.id,
        },
        bin: {
          id: bin.id,
        },
        sourceType: SourceType.INBOUND,
        sourceId: 155,
        description: 'Test description',
      },
    });

    expect(stockHistory).toMatchObject([
      {
        sourceType: SourceType.INBOUND,
        sourceId: 155,
        description: 'Test description',
        quantity: 10,
      },
    ]);
  });
});

describe('subtractProductFromBin', () => {
  it('should throw QUANTITY_OUT_OF_RANGE error if subtracting more units than available in BinProduct', async () => {
    const productService = new ProductService(AppDataSource, 1);

    await disableForeignKeyCheck();

    const product = await repo(Product).save({
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      creator: { id: 1 },
    });

    const bin = await repo(Bin).save({
      name: 'bin1',
      warehouse,
      internalCode: 'hey1',
      creator: { id: 1 },
    });

    await repo(BinProduct).save({
      bin,
      product,
      quantity: 5,
      creator: { id: 1 },
    });

    await enableForeignKeyCheck();

    // Attempt to subtract 10 units of the product from the bin, but only 5 are available
    await expect(
      productService.subtractProductFromBin({
        product,
        bin,
        quantity: 10,
        sourceType: SourceType.OUTBOUND,
        sourceId: 155,
        description: 'Test description',
      }),
    ).rejects.toThrow(Error);

    const binProduct = await repo(BinProduct).findOne({
      where: {
        bin: {
          id: bin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    expect(binProduct?.quantity).toBe(5);
  });
});

describe('Move', () => {
  it('should move units of a product from one bin to another and log product stock histories', async () => {
    const productService = new ProductService(AppDataSource, 1);

    await disableForeignKeyCheck();

    const product = await repo(Product).save({
      name: 'product 1',
      barcode: '123',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      creator: { id: 1 },
    });

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

    await productService.move(product, sourceBin, targetBin, 5);

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

    const targetBinProduct = await repo(BinProduct).findOne({
      where: {
        bin: {
          id: targetBin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    expect(sourceBinProduct?.quantity).toBe(5);
    expect(targetBinProduct?.quantity).toBe(5);

    const sourceStockHistory = await repo(ProductStockHistory).findOne({
      where: {
        product: {
          id: product.id,
        },
        bin: {
          id: sourceBin.id,
        },
        sourceType: SourceType.MOVE,
        sourceId: targetBin.id,
        description: `Move product 1 from bin1 to bin2`,
      },
    });

    const targetStockHistory = await repo(ProductStockHistory).findOne({
      where: {
        product: {
          id: product.id,
        },
        bin: {
          id: targetBin.id,
        },
        sourceType: SourceType.MOVE,
        sourceId: sourceBin.id,
        description: `Move product 1 from bin1 to bin2`,
      },
    });

    expect(sourceStockHistory).toMatchObject({
      sourceType: SourceType.MOVE,
      description: `Move product 1 from bin1 to bin2`,
      quantity: -5,
    });

    expect(targetStockHistory).toMatchObject({
      sourceType: SourceType.MOVE,
      description: `Move product 1 from bin1 to bin2`,
      quantity: 5,
    });
  });
});
