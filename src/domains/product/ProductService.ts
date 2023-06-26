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
    productId,
    binId,
    quantity,
    sourceType,
    sourceId,
    description,
  }: {
    productId: number;
    binId: number;
    quantity: number;
    sourceType: SourceType;
    sourceId: number | null;
    description: string;
  }) {
    const { binProductsRepo, productStockHistoriesRepo } = this;

    let binProduct = await binProductsRepo.findOne({
      where: {
        bin: {
          id: binId,
        },
        product: {
          id: productId,
        },
      },
    });

    if (!binProduct) {
      binProduct = binProductsRepo.create({
        bin: {
          id: binId,
        },
        product: {
          id: productId,
        },
      });
    }

    const currentQuantity: number = binProduct.quantity ?? 0;
    binProduct.quantity = currentQuantity + quantity;
    await binProductsRepo.save(binProduct);

    await productStockHistoriesRepo.save({
      product: {
        id: productId,
      },
      sourceId,
      sourceType,
      description,
      bin: {
        id: binId,
      },
      quantity,
      creator: {
        id: this.#userId,
      },
    });
  }

  async subtractProductFromBin({
    productId,
    binId,
    quantity,
    sourceType,
    sourceId,
    description,
  }: {
    productId: number;
    binId: number;
    quantity: number;
    sourceType: SourceType;
    sourceId: number;
    description: string;
  }) {
    const { binProductsRepo, productStockHistoriesRepo } = this;

    const binProduct = await binProductsRepo.findOne({
      where: {
        bin: {
          id: binId,
        },
        product: {
          id: productId,
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
      product: {
        id: productId,
      },
      bin: {
        id: binId,
      },
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
      productId: product.id,
      binId: sourceBin.id,
      quantity,
      sourceId: targetBin.id,
      sourceType: SourceType.MOVE,
      description,
    });

    await this.addProductToBin({
      productId: product.id,
      binId: targetBin.id,
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
