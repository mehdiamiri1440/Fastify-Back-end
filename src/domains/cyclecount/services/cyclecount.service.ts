import {
  DataSource,
  DeepPartial,
  Driver,
  EntityManager,
  Repository,
} from 'typeorm';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import createError from '@fastify/error';
import { Product } from '$src/domains/product/models/Product';
import { loadUserWarehouse } from '../utils';
import { ProductService } from '$src/domains/product/ProductService';
import { SourceType } from '$src/domains/product/models/ProductStockHistory';
import { CycleCount } from '$src/domains/cyclecount/models/CycleCount';
import { CycleCountDifference } from '$src/domains/cyclecount/models/Difference';
import { Static, Type } from '@sinclair/typebox';
import { CycleCountSchema } from '$src/domains/cyclecount/schemas/cyclecount.schema';
const CYCLE_COUNT_IS_NOT_OPEN = createError(
  'CYCLE_COUNT_IS_NOT_OPEN',
  'this cycle count is not open',
  400,
);
const NOT_CHECKED = createError(
  'NOT_CHECKED',
  'difference not checked by checker in last 5 days',
  400,
);
const NOT_COUNTED = createError(
  'NOT_COUNTED',
  'difference not counted by counter',
  400,
);
const MISS_PRODUCT = createError(
  'MISS_PRODUCT',
  'miss product id in cycle count type Product',
  400,
);
const MISS_BIN = createError(
  'MISS_BIN',
  'miss bin id in cycle count type Bin',
  400,
);

const bodySchema = Type.Omit(CycleCountSchema, [
  'id',
  'cycleCountState',
  'checker',
  'creator',
  'createdAt',
  'updatedAt',
  'deletedAt',
]);

export class CycleCountService {
  #dataSource: DataSource | EntityManager;
  private CycleCountsRepo: Repository<CycleCount>;
  private DifferencesRepo: Repository<CycleCountDifference>;
  private BinsRepo: Repository<Bin>;
  private ProductsRepo: Repository<Product>;
  private BinProductsRepo: Repository<BinProduct>;
  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.#dataSource = dataSource;
    this.CycleCountsRepo = dataSource.getRepository(CycleCount);
    this.DifferencesRepo = dataSource.getRepository(CycleCountDifference);
    this.BinsRepo = dataSource.getRepository(Bin);
    this.ProductsRepo = dataSource.getRepository(Product);
    this.BinProductsRepo = dataSource.getRepository(BinProduct);

    this.#userId = userId;
  }

  async createWithType(body: Static<typeof bodySchema>) {
    switch (body.cycleCountType) {
      case 'Product': {
        if (!body.product) {
          throw new MISS_PRODUCT();
        }
        const product = await this.ProductsRepo.findOneByOrFail({
          id: body.product,
        });
        return await this.#saveProductCycleCount({
          cycleCountState: 'open',
          cycleCountType: body.cycleCountType,
          product,
          creator: { id: this.#userId },
        });
      }
      case 'Bin': {
        if (!body.bin) {
          throw new MISS_BIN();
        }
        const bin = await this.BinsRepo.findOneByOrFail({ id: body.bin });
        return await this.#saveBinCycleCount({
          cycleCountState: 'open',
          cycleCountType: body.cycleCountType,
          bin,
          creator: { id: this.#userId },
        });
      }
    }
  }

  async #saveBinCycleCount(entity: DeepPartial<CycleCount>) {
    // create a bin cycle count
    const cycleCount = await this.CycleCountsRepo.save(entity);

    // create differences for bin cycle count
    const productsInBin = await this.BinProductsRepo.find({
      where: { bin: { id: cycleCount.bin.id } },
      relations: { bin: true, product: true },
    });
    for (const productInBin of productsInBin) {
      await this.DifferencesRepo.save({
        cycleCount,
        binProduct: productInBin,
        difference: 0,
      });
    }

    return cycleCount;
  }

  async #saveProductCycleCount(entity: DeepPartial<CycleCount>) {
    // create a product cycle count
    const cycleCount = await this.CycleCountsRepo.save(entity);

    // find warehouse of user that want to create cycle count for product
    const warehouse = await loadUserWarehouse(this.#userId);

    // create differences for product cycle count
    const BinsOfProduct = await this.BinProductsRepo.find({
      where: {
        product: { id: cycleCount.product.id },
        bin: { warehouse: { id: warehouse.id } },
      },
      relations: { product: true, bin: { warehouse: true } },
    });
    for (const BinOfProduct of BinsOfProduct) {
      await this.DifferencesRepo.save({
        cycleCount,
        binProduct: BinOfProduct,
        difference: 0,
      });
    }

    return cycleCount;
  }

  async changeDiff({
    difference,
    amount,
  }: {
    difference: CycleCountDifference;
    amount: number;
  }) {
    const cycleCount = await this.CycleCountsRepo.findOneOrFail({
      where: {
        id: difference.cycleCount.id,
      },
    });
    if (cycleCount.cycleCountState == 'open') {
      // this cycle count is open, counter can count
      await this.DifferencesRepo.update(
        { id: difference.id },
        { difference: amount, counter: { id: this.#userId } },
      );
    } else {
      // this cycle count is not open and its readonly
      throw new CYCLE_COUNT_IS_NOT_OPEN();
    }
  }

  async apply({ cycleCount }: { cycleCount: CycleCount }) {
    if (cycleCount.cycleCountState != 'open') {
      // this cycle count is done and its readonly
      throw new CYCLE_COUNT_IS_NOT_OPEN();
    }

    const differences = await this.DifferencesRepo.find({
      where: {
        cycleCount: { id: cycleCount.id },
      },
      relations: {
        counter: true,
        binProduct: { bin: true, product: true },
        cycleCount: true,
      },
    });

    for (const difference of differences) {
      await this.DifferencesRepo.update(
        { id: difference.id },
        {
          quantity: difference.binProduct.quantity,
        },
      );
    }

    await this.CycleCountsRepo.update(
      { id: cycleCount.id },
      { checker: { id: this.#userId }, cycleCountState: 'applied' },
    );

    // change binProduct value
    const service = new ProductService(this.#dataSource, this.#userId);
    for (const difference of differences) {
      if (difference.difference !== 0) {
        await service.addProductToBin({
          product: difference.binProduct.product,
          bin: difference.binProduct.bin,
          quantity: difference.difference,
          sourceType: SourceType.CYCLE_COUNT,
          sourceId: difference.cycleCount.id,
          description: `detected by difference ${difference.id} of cycle count`,
        });
      }
    }
  }

  async reject({ cycleCount }: { cycleCount: CycleCount }) {
    if (cycleCount.cycleCountState != 'open') {
      // this cycle count is done and its readonly
      throw new CYCLE_COUNT_IS_NOT_OPEN();
    }

    const differences = await this.DifferencesRepo.find({
      where: {
        cycleCount: { id: cycleCount.id },
      },
      relations: {
        counter: true,
        binProduct: { bin: true, product: true },
        cycleCount: true,
      },
    });

    for (const difference of differences) {
      await this.DifferencesRepo.update(
        { id: difference.id },
        {
          quantity: difference.binProduct.quantity,
        },
      );
    }

    await this.CycleCountsRepo.update(
      { id: cycleCount.id },
      { checker: { id: this.#userId }, cycleCountState: 'rejected' },
    );
  }
}
