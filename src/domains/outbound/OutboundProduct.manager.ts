/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { repo } from '$src/infra/utils/repo';
import assert from 'assert';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProductService } from '../product/ProductService';
import { SourceType } from '../product/models/ProductStockHistory';
import { Bin } from '../warehouse/models/Bin';
import {
  ALREADY_SUPPLIED,
  INCOMPLETE_PRODUCT_SUPPLY,
  INVALID_STATUS,
} from './errors';
import { OutboundStatus } from './models/Outbound';
import { OutboundProduct, ProductSupplyState } from './models/OutboundProduct';
import { OutboundProductSupply } from './models/OutboundProductSupply';

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);

export interface BinSupplyState {
  binId: number;
  binName: string;
  freeQuantity: number;
  suppliedQuantity: number;
}

export class OutboundProductManager {
  private outboundProductsRepo: Repository<OutboundProduct>;
  private outboundProductSuppliesRepo: Repository<OutboundProductSupply>;
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

  get expectedQuantity() {
    return this.entity.quantity;
  }

  get state() {
    return this.entity.supplyState;
  }

  constructor(
    dataSource: DataSource | EntityManager,
    id: number,
    userId: number,
  ) {
    this.outboundProductsRepo = dataSource.getRepository(OutboundProduct);
    this.outboundProductSuppliesRepo = dataSource.getRepository(
      OutboundProductSupply,
    );
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
          );
      }, 'suppliedQuantity')
      .addSelect((subQuery) => {
        return subQuery
          .select('SUM(bin_product.quantity)', 'availableQuantityInBin')
          .from('BinProduct', 'bin_product')
          .where('bin_product.bin_id = bin.id')
          .andWhere('bin_product.product_id = :productId', {
            productId: this.entity.product.id,
          });
      }, 'availableQuantityInBin')

      .where('bin.warehouse_id = :warehouseId', {
        warehouseId: this.warehouseId,
      })
      .getRawMany();

    const freeQuantity = (row: any) => {
      const availableQuantityInBin =
        parseInt(row.availableQuantityInBin, 10) || 0;

      // if the supply is already applied, we don't need to subtract the reserved quantity
      if (this.state === ProductSupplyState.APPLIED) {
        return availableQuantityInBin;
      }

      // subtract the reserved quantity from the available quantity
      return availableQuantityInBin - row.suppliedQuantity;
    };

    const data: BinSupplyState[] = rawData
      .map((row) => ({
        binId: row.binId,
        binName: row.binName,
        suppliedQuantity: parseInt(row.suppliedQuantity, 10) || 0,
        freeQuantity: freeQuantity(row),
      }))
      // remove useless states
      .filter((r) => r.freeQuantity > 0 || r.suppliedQuantity > 0);

    return data;
  }

  async #refreshSuppliedState() {
    const currentState = this.entity.supplyState;
    const newState =
      this.entity.quantity === this.suppliedQuantity
        ? ProductSupplyState.SUBMITTED
        : ProductSupplyState.PENDING;

    if (currentState === newState) return;

    await this.outboundProductsRepo.update(this.entity.id, {
      supplyState: newState,
    });

    this.entity.supplyState = newState;
  }

  #assertNewOrder() {
    if (this.entity.outbound.status !== OutboundStatus.NEW_ORDER) {
      throw new INVALID_STATUS(`only new_order outbounds can be supplied`);
    }
  }

  async addDraftSupply({ bin, quantity }: { bin: Bin; quantity: number }) {
    this.#assertNewOrder();

    if (this.state !== ProductSupplyState.PENDING) {
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
      applied: false,
      creator: this.creator,
    });

    // await this.productService.subtractProductFromBin({
    //   product: this.entity.product,
    //   bin,
    //   quantity,
    //   sourceType: SourceType.OUTBOUND,
    //   sourceId: this.entity.outbound.id,
    //   description: `Supplied ${quantity} ${this.entity.product.name} by outbound id:${this.entity.outbound.id}`,
    // });
  }

  async deleteDraftSupply(bin: Bin) {
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

    await this.outboundProductSuppliesRepo.delete(outboundProductSupply.id);
  }

  async applySupplies() {
    this.#assertNewOrder();
    if (this.state === ProductSupplyState.APPLIED) {
      throw new ALREADY_SUPPLIED();
    }

    if (this.state === ProductSupplyState.PENDING) {
      throw new INCOMPLETE_PRODUCT_SUPPLY();
    }

    if (this.suppliedQuantity !== this.expectedQuantity) {
      throw new INCOMPLETE_PRODUCT_SUPPLY();
    }

    // const toApplySupplies = this.#supplyState.filter(
    //   (s) => s.suppliedQuantity > 0,
    // );
    const supplies = await this.outboundProductSuppliesRepo.find({
      where: {
        outboundProduct: {
          id: this.id,
        },
      },
      loadRelationIds: {
        disableMixedMap: true,
      },
    });

    for (const supply of supplies) {
      await this.productService.subtractProductFromBin({
        productId: this.entity.product.id,
        binId: supply.bin.id,
        quantity: supply.quantity,
        sourceType: SourceType.OUTBOUND,
        sourceId: this.entity.outbound.id,
        description: `Supplied ${supply.quantity} ${this.entity.product.name} by outbound id:${this.entity.outbound.id}`,
      });
    }

    this.entity.supplyState = ProductSupplyState.APPLIED;
    await this.outboundProductsRepo.save(this.entity);
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
