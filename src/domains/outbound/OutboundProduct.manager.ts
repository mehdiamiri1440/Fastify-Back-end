/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { repo } from '$src/infra/utils/repo';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Product } from '../product/models/Product';
import { Bin } from '../warehouse/models/Bin';
import { Outbound, OutboundStatus } from './models/Outbound';
import { OutboundProduct } from './models/OutboundProduct';
import assert from 'assert';
import { OutboundProductSupply } from './models/OutboundProductSupply';
import createError from '@fastify/error';
import { ProductService } from '../product/ProductService';
import { SourceType } from '../product/models/ProductStockHistory';

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);

const OUTBOUND_INVALID_STATUS = createError(
  'OUTBOUND_INVALID_STATUS',
  'Only new_order outbounds can be accepted',
  400,
);

const ALREADY_SUPPLIED = createError(
  'ALREADY_SUPPLIED',
  'Product is already supplied',
  400,
);

export interface BinSupplyState {
  binId: number;
  binName: string;
  freeQuantity: number;
  suppliedQuantity: number;
}

export class OutboundProductManager {
  private outboundsRepo: Repository<Outbound>;
  private outboundProductsRepo: Repository<OutboundProduct>;
  private outboundProductSuppliesRepo: Repository<OutboundProductSupply>;
  private productsRepo: Repository<Product>;
  private productService: ProductService;

  creator!: { id: number };

  id!: number;
  #supplyState!: BinSupplyState[];
  entity!: OutboundProduct;
  warehouseId!: number;

  get supplyState() {
    assert(this.#supplyState);
    return this.#supplyState!;
  }

  get suppliedQuantity() {
    assert(this.#supplyState);
    return sum(this.#supplyState!.map((s) => s.suppliedQuantity));
  }

  get freeQuantity() {
    assert(this.#supplyState);
    return sum(this.#supplyState!.map((s) => s.freeQuantity));
  }

  get supplied() {
    return this.entity.supplied;
  }

  constructor(
    dataSource: DataSource | EntityManager,
    id: number,
    userId: number,
  ) {
    this.outboundsRepo = dataSource.getRepository(Outbound);
    this.outboundProductsRepo = dataSource.getRepository(OutboundProduct);
    this.outboundProductSuppliesRepo = dataSource.getRepository(
      OutboundProductSupply,
    );
    this.productsRepo = dataSource.getRepository(Product);
    this.productService = new ProductService(dataSource, userId);
    this.id = id;
    this.creator = { id: userId };
  }

  async #loadSupplyState(): Promise<BinSupplyState[]> {
    assert(this.id);

    const rawData = await repo(Bin)
      .createQueryBuilder('bin')
      .select('bin.id', 'binId')
      .addSelect('bin.name', 'binName')
      .addSelect((subQuery) => {
        return subQuery
          .select('SUM(outbound_product_supply.quantity)', 'suppliedQuantity')
          .from('OutboundProductSupply', 'outbound_product_supply')
          .where('outbound_product_supply.bin_id = bin.id')
          .andWhere(
            'outbound_product_supply.outbound_product_id = :outboundProductId',
            {
              outboundProductId: this.id,
            },
          )
          .andWhere('outbound_product_supply.deleted_at IS NULL');
      }, 'suppliedQuantity')
      .addSelect((subQuery) => {
        return subQuery
          .select('SUM(bin_product.quantity)', 'freeQuantity')
          .from('BinProduct', 'bin_product')
          .where('bin_product.bin_id = bin.id')
          .andWhere('bin_product.deleted_at IS NULL');
      }, 'freeQuantity')

      .andWhere('bin.warehouse_id = :warehouseId', {
        warehouseId: this.warehouseId,
      })
      .andWhere('bin.deleted_at IS NULL')
      .getRawMany();

    const data: BinSupplyState[] = rawData.map((row) => ({
      binId: row.binId,
      binName: row.binName,
      suppliedQuantity: parseInt(row.suppliedQuantity, 10) || 0,
      freeQuantity: parseInt(row.freeQuantity, 10) || 0,
    }));

    return data;
  }

  async #refreshSuppliedState() {
    const currentState = this.entity.supplied;
    const newState = this.entity.quantity === this.suppliedQuantity;

    if (currentState === newState) return;

    await this.outboundProductsRepo.update(this.entity.id, {
      supplied: newState,
    });

    this.entity.supplied = newState;
  }

  #assertNewOrder() {
    if (this.entity.outbound.status !== OutboundStatus.NEW_ORDER) {
      throw new OUTBOUND_INVALID_STATUS();
    }
  }

  async supply({ bin, quantity }: { bin: Bin; quantity: number }) {
    this.#assertNewOrder();

    if (this.supplied) {
      throw new ALREADY_SUPPLIED();
    }

    const binState = this.#supplyState.find((s) => s.binId === bin.id);
    assert(binState, `Bin ${bin.id} doesn't have this product to supply`);

    const canSupply = binState.freeQuantity >= quantity;
    if (!canSupply) {
      throw new Error(
        `Not enough stock: current stock ${binState.freeQuantity}, requested ${quantity}`,
      );
    }

    await this.outboundProductSuppliesRepo.save({
      outboundProduct: this.entity,
      bin,
      quantity,
      creator: this.creator,
    });

    await this.productService.subtractProductFromBin({
      product: this.entity.product,
      bin,
      quantity,
      sourceType: SourceType.OUTBOUND,
      sourceId: this.entity.outbound.id,
      description: `Supplied ${quantity} ${this.entity.product.name} by outbound id:${this.entity.outbound.id}`,
    });
  }

  async deleteSupply(bin: Bin) {
    this.#assertNewOrder();

    const binState = this.#supplyState.find((s) => s.binId === bin.id);
    assert(binState, `Bin ${bin.id} doesn't have this product to supply`);

    const outboundProductSupply =
      await this.outboundProductSuppliesRepo.findOneOrFail({
        where: {
          bin: {
            id: bin.id,
          },
        },
      });

    const quantity = outboundProductSupply.quantity;

    await this.outboundProductSuppliesRepo.softDelete(outboundProductSupply.id);

    await this.productService.addProductToBin({
      product: this.entity.product,
      bin,
      quantity,
      sourceType: SourceType.OUTBOUND,
      sourceId: this.entity.outbound.id,
      description: `Revert: supply ${quantity} ${this.entity.product.name} by outbound id:${this.entity.outbound.id}`,
    });
  }

  async load() {
    const entity = await this.outboundProductsRepo.findOneOrFail({
      where: {
        id: this.id,
      },
      relations: {
        product: true,
        outbound: {
          warehouse: true,
        },
      },
    });

    this.entity = entity;
    this.warehouseId = entity.outbound.warehouse.id;

    this.#supplyState = await this.#loadSupplyState();
    await this.#refreshSuppliedState();

    return this;
  }
}
