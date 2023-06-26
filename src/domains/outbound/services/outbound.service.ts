import { DocumentService } from '$src/domains/document/service';
import { Product } from '$src/domains/product/models/Product';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import createError from '@fastify/error';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { INCOMPLETE_SUPPLY, INVALID_STATUS } from '../errors';
import { Outbound, OutboundStatus } from '../models/Outbound';
import { OutboundProduct, ProductSupplyState } from '../models/OutboundProduct';
import { OutboundProductManager } from '../OutboundProduct.manager';

const MISSING_SIGNATURE = createError('MISSING_SIGNATURE', '%s', 400);

export class OutboundService {
  private outboundsRepo: Repository<Outbound>;
  private outboundProductsRepo: Repository<OutboundProduct>;
  private productsRepo: Repository<Product>;

  private documentService: DocumentService;
  #userId: number;
  #dataSource: DataSource | EntityManager;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.#dataSource = dataSource;
    this.outboundsRepo = dataSource.getRepository(Outbound);
    this.outboundProductsRepo = dataSource.getRepository(OutboundProduct);
    this.productsRepo = dataSource.getRepository(Product);

    this.documentService = new DocumentService(dataSource, userId);
    this.#userId = userId;
  }

  async #saveOutbound(entity: DeepPartial<Outbound>) {
    const { id } = await this.outboundsRepo.save(entity);
    const outbound = await this.outboundsRepo.findOneByOrFail({ id });

    const document = await this.documentService.create({
      type: 'outbound',
      typeId: outbound.id,
    });
    outbound.docId = document.id;

    await this.outboundsRepo.save(outbound);
    return outbound;
  }

  async create({ warehouse }: { warehouse: Warehouse }) {
    const inbound = await this.#saveOutbound({
      warehouse,
      creator: { id: this.#userId },
    });

    return inbound;
  }

  async addProduct(
    outbound: Outbound,
    productId: number,
    {
      quantity,
    }: {
      quantity: number;
    },
  ) {
    const product = await this.productsRepo.findOneByOrFail({ id: productId });

    await this.outboundProductsRepo.save<DeepPartial<OutboundProduct>>({
      outbound,
      product,
      quantity,
      creator: { id: this.#userId },
    });
  }

  async confirmStep(outbound: Outbound) {
    const confirmFn = this.#confirmStateMap[outbound.status];
    await confirmFn(outbound);
  }

  #confirmStateMap: Record<
    OutboundStatus,
    (outbound: Outbound) => Promise<void>
  > = {
    [OutboundStatus.DRAFT]: this.#confirmOrder.bind(this),
    [OutboundStatus.NEW_ORDER]: this.#confirmSupply.bind(this),
    [OutboundStatus.TRANSFER]: this.#confirmTransfer.bind(this),
    [OutboundStatus.PICKING]: this.#confirmPicking.bind(this),
    [OutboundStatus.PICKED]: this.#confirmPicked.bind(this),
    // state: delivered has no confirmation
    [OutboundStatus.DELIVERED]: async () => undefined,
  };

  async #confirmOrder(outbound: Outbound) {
    if (outbound.status !== OutboundStatus.DRAFT) {
      throw new INVALID_STATUS(`only draft outbounds can be confirmed`);
    }

    await this.outboundsRepo.update(outbound.id, {
      status: OutboundStatus.NEW_ORDER,
    });
  }

  async #confirmSupply(outbound: Outbound) {
    if (outbound.status !== OutboundStatus.NEW_ORDER) {
      throw new INVALID_STATUS(`only new order outbounds can be confirmed`);
    }

    const outboundProducts = await this.outboundProductsRepo.find({
      where: {
        outbound: { id: outbound.id },
      },
    });

    if (
      outboundProducts.filter(
        (outboundProducts) =>
          outboundProducts.supplyState === ProductSupplyState.PENDING,
      ).length > 0
    ) {
      throw new INCOMPLETE_SUPPLY();
    }

    for (const outboundProduct of outboundProducts) {
      const manager = new OutboundProductManager(
        this.#dataSource,
        outboundProduct.id,
        this.#userId,
      );

      await manager.load();
      await manager.applySupplies();
    }

    await this.outboundsRepo.update(outbound.id, {
      status: OutboundStatus.TRANSFER,
    });
  }

  async #confirmTransfer(outbound: Outbound) {
    if (outbound.status !== OutboundStatus.TRANSFER) {
      throw new INVALID_STATUS(`only transfer outbounds can be confirmed`);
    }

    const hasDriver = !!outbound.driver;

    const nextStatus = hasDriver
      ? OutboundStatus.PICKING
      : OutboundStatus.DELIVERED;

    if (hasDriver) {
      await this.outboundsRepo.update(outbound.id, {
        status: nextStatus,
      });
      // outbound has driver. we should grab signatures in next step (picking) status
      return;
    }

    if (!outbound.creatorSignature) {
      throw new MISSING_SIGNATURE('Creator signature is required');
    }

    if (!outbound.customerSignature) {
      throw new MISSING_SIGNATURE('Customer signature is required');
    }

    await this.outboundsRepo.update(outbound.id, {
      status: nextStatus,
    });
  }

  async #confirmPicking(outbound: Outbound) {
    if (outbound.status !== OutboundStatus.PICKING) {
      throw new INVALID_STATUS('outbound state is not PICKING');
    }

    if (!outbound.creatorSignature) {
      throw new MISSING_SIGNATURE('Creator signature is required');
    }

    if (!outbound.driverSignature) {
      throw new MISSING_SIGNATURE('Driver signature is required');
    }

    await this.outboundsRepo.update(outbound.id, {
      status: OutboundStatus.PICKED,
    });
  }

  async #confirmPicked(outbound: Outbound) {
    if (outbound.status !== OutboundStatus.PICKED) {
      throw new INVALID_STATUS(`only 'picked' outbounds can be confirmed`);
    }

    if (!outbound.customerSignature) {
      throw new MISSING_SIGNATURE('Customer signature is required');
    }

    await this.outboundsRepo.update(outbound.id, {
      status: OutboundStatus.DELIVERED,
    });
  }
}
