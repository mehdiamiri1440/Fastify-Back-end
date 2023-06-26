/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from 'assert';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ProductService } from '../product/ProductService';
import { SourceType } from '../product/models/ProductStockHistory';
import { Bin } from '../warehouse/models/Bin';
import {
  BIN_ALREADY_SORTED,
  INCOMPLETE_SORTING,
  INVALID_QUANTITY_AMOUNT,
  INVALID_STATUS,
  PRODUCT_ALREADY_SORTED,
} from './errors';
import { InboundStatus } from './models/Inbound';
import { InboundProduct, ProductSortState } from './models/InboundProduct';
import { InboundProductSort } from './models/InboundProductSort';

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0);

export interface BinSortState {
  binId: number;
  binName: string;
  sortedQuantity: number;
}

export class InboundProductManager {
  private inboundProductRepo: Repository<InboundProduct>;
  private inboundProductSortsRepo: Repository<InboundProductSort>;
  private productService: ProductService;

  creator!: { id: number };

  id!: number;
  entity!: InboundProduct;
  warehouseId!: number;

  get sorts() {
    return this.entity.sorts;
  }

  get sortedQuantity() {
    assert(this.sorts);
    return sum(this.sorts!.map((s) => s.quantity));
  }

  get actualQuantity() {
    return this.entity.actualQuantity;
  }

  get unsortedQuantity() {
    assert(this.sorts);
    return this.entity.actualQuantity - this.sortedQuantity;
  }

  get state() {
    return this.entity.sortState;
  }

  constructor(
    dataSource: DataSource | EntityManager,
    id: number,
    userId: number,
  ) {
    this.inboundProductRepo = dataSource.getRepository(InboundProduct);
    this.inboundProductSortsRepo = dataSource.getRepository(InboundProductSort);
    this.productService = new ProductService(dataSource, userId);
    this.id = id;
    this.creator = { id: userId };
  }

  async #refreshSortState() {
    const currentState = this.entity.sortState;
    const newState =
      this.entity.actualQuantity === this.sortedQuantity
        ? ProductSortState.SUBMITTED
        : ProductSortState.PENDING;

    if (currentState === newState) return;

    await this.inboundProductRepo.update(this.entity.id, {
      sortState: newState,
    });

    this.entity.sortState = newState;
  }

  #assertSortingState() {
    if (this.entity.inbound.status !== InboundStatus.SORTING) {
      throw new INVALID_STATUS(
        'Only inbounds with sorting state are allowed to sort',
      );
    }
  }

  async addDraftSort({ bin, quantity }: { bin: Bin; quantity: number }) {
    this.#assertSortingState();

    if (this.state !== ProductSortState.PENDING) {
      throw new PRODUCT_ALREADY_SORTED();
    }

    if (this.sorts.find((sort) => sort.bin.id === bin.id)) {
      throw new BIN_ALREADY_SORTED();
    }

    if (quantity > this.unsortedQuantity) {
      throw new INVALID_QUANTITY_AMOUNT(
        `Current unsorted quantity: ${this.unsortedQuantity}. Can not sort amount: ${quantity}`,
      );
    }

    const sort = await this.inboundProductSortsRepo.save({
      inboundProduct: this.entity,
      bin,
      quantity,
      creator: this.creator,
    });

    // this will update the product sort state
    await this.load();

    return sort;
  }

  async deleteDraftSort(bin: Bin) {
    this.#assertSortingState();

    const productSort = this.sorts.find((s) => s.bin.id === bin.id);
    assert(productSort, `Bin ${bin.id} doesn't have this product to un-sort`);

    await this.inboundProductSortsRepo.delete(productSort.id);

    // this will update the product sort state
    await this.load();

    return productSort;
  }

  async applySorts() {
    this.#assertSortingState();
    if (this.state === ProductSortState.APPLIED) {
      throw new PRODUCT_ALREADY_SORTED();
    }

    if (this.state === ProductSortState.PENDING) {
      throw new INCOMPLETE_SORTING();
    }

    if (this.sortedQuantity !== this.actualQuantity) {
      throw new INCOMPLETE_SORTING();
    }

    for (const sort of this.entity.sorts) {
      await this.productService.addProductToBin({
        productId: this.entity.product.id,
        binId: sort.bin.id,
        quantity: sort.quantity,
        sourceType: SourceType.INBOUND,
        sourceId: this.entity.inbound.id,
        description: `Sorted ${sort.quantity} ${this.entity.product.name} from inbound id: ${this.entity.inbound.id}`,
      });
    }

    this.entity.sortState = ProductSortState.APPLIED;
    await this.inboundProductRepo.save(this.entity);
  }

  async load() {
    const entity = await this.inboundProductRepo.findOneOrFail({
      where: {
        id: this.id,
      },
      relations: {
        product: true,
        sorts: {
          bin: true,
        },
        inbound: {
          warehouse: true,
        },
      },
    });

    this.entity = entity;
    this.warehouseId = entity.inbound.warehouse.id;

    await this.#refreshSortState();

    return this;
  }
}
