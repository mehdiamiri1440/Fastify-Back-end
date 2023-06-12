import { createError } from '@fastify/error';
import { Bin } from '../warehouse/models/Bin';
import { BinProduct } from './models/BinProduct';
import { Product } from './models/Product';
import { ProductStockHistory, SourceType } from './models/ProductStockHistory';

import assert from 'assert';
import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

const QUANTITY_OUT_OF_RANGE = createError(
  'QUANTITY_OUT_OF_RANGE',
  'quantity out of range',
  400,
);

export class ProductService {
  private productsRepo: Repository<Product>;
  private binProductsRepo: Repository<BinProduct>;
  private productStockHistoriesRepo: Repository<ProductStockHistory>;

  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.productsRepo = dataSource.getRepository(Product);
    this.binProductsRepo = dataSource.getRepository(BinProduct);
    this.productStockHistoriesRepo =
      dataSource.getRepository(ProductStockHistory);

    this.#userId = userId;
  }

  async addProductToBin({
    product,
    bin,
    quantity,
    sourceType,
    sourceId,
    description,
  }: {
    product: Product;
    bin: Bin;
    quantity: number;
    sourceType: SourceType;
    sourceId: number | null;
    description: string;
  }) {
    const { binProductsRepo, productStockHistoriesRepo } = this;

    let binProduct = await binProductsRepo.findOne({
      where: {
        bin: {
          id: bin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    if (!binProduct) {
      binProduct = binProductsRepo.create({
        bin,
        product,
      });
    }

    const currentQuantity: number = binProduct.quantity ?? 0;
    binProduct.quantity = currentQuantity + quantity;
    await binProductsRepo.save(binProduct);

    await productStockHistoriesRepo.save({
      product,
      sourceId,
      sourceType,
      description,
      bin,
      quantity,
      creator: {
        id: this.#userId,
      },
    });
  }

  async subtractProductFromBin({
    product,
    bin,
    quantity,
    sourceType,
    sourceId,
    description,
  }: {
    product: Product;
    bin: Bin;
    quantity: number;
    sourceType: SourceType;
    sourceId: number;
    description: string;
  }) {
    const { binProductsRepo, productStockHistoriesRepo } = this;

    const binProduct = await binProductsRepo.findOne({
      where: {
        bin: {
          id: bin.id,
        },
        product: {
          id: product.id,
        },
      },
    });

    assert(binProduct, `there is no BinProduct to subtract assets from it.`);

    if (binProduct.quantity < quantity) {
      throw new QUANTITY_OUT_OF_RANGE();
    }

    const currentQuantity: number = binProduct.quantity ?? 0;
    binProduct.quantity = currentQuantity - quantity;
    await binProductsRepo.save(binProduct);

    await productStockHistoriesRepo.save({
      product,
      bin,
      sourceType,
      sourceId,
      description,
      quantity: quantity * -1,
      creator: {
        id: this.#userId,
      },
    });
  }

  async move(
    product: Product,
    sourceBin: Bin,
    targetBin: Bin,
    quantity: number,
  ) {
    const description = `Move ${product.name} from ${sourceBin.name} to ${targetBin.name}`;

    await this.subtractProductFromBin({
      product,
      bin: sourceBin,
      quantity,
      sourceId: targetBin.id,
      sourceType: SourceType.MOVE,
      description,
    });

    await this.addProductToBin({
      product,
      bin: targetBin,
      quantity,
      sourceType: SourceType.MOVE,
      sourceId: sourceBin.id,
      description,
    });
  }
  async getBinQuantity(bin: Bin): Promise<number> {
    return (
      (await this.binProductsRepo.sum('quantity', { bin: { id: bin.id } })) ?? 0
    );
  }
  async getProductQuantity(product: Product): Promise<number> {
    return (
      (await this.binProductsRepo.sum('quantity', {
        product: { id: product.id },
      })) ?? 0
    );
  }
}
