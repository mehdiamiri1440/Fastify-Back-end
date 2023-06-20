import { DocumentService } from '$src/domains/document/service';
import { Product } from '$src/domains/product/models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { User } from '$src/domains/user/models/User';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Inbound, InboundStatus, InboundType } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import AppDataSource from '$src/DataSource';
import { repo } from '$src/infra/utils/repo';

export class InboundService {
  private inboundsRepo: Repository<Inbound>;
  private inboundProductsRepo: Repository<InboundProduct>;
  private productsRepo: Repository<Product>;
  private suppliersRepo: Repository<Supplier>;

  private documentService: DocumentService;
  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.inboundsRepo = dataSource.getRepository(Inbound);
    this.inboundProductsRepo = dataSource.getRepository(InboundProduct);
    this.productsRepo = dataSource.getRepository(Product);
    this.suppliersRepo = dataSource.getRepository(Supplier);

    this.documentService = new DocumentService(dataSource, userId);
    this.#userId = userId;
  }

  async #saveInbound(entity: DeepPartial<Inbound>) {
    const { id } = await this.inboundsRepo.save(entity);
    // we should reload the entity to get the new code generated
    const inbound = await this.inboundsRepo.findOneByOrFail({ id });

    const document = await this.documentService.create({
      type: 'inbound',
      typeId: inbound.id,
    });
    inbound.docId = document.id;

    await this.inboundsRepo.save(inbound);
    return inbound;
  }

  async create({
    type,
    warehouse,
    driver,
  }: {
    type: InboundType;
    warehouse: Warehouse;
    driver?: User | null;
  }) {
    const inbound = await this.#saveInbound({
      type,
      status: InboundStatus.PRE_DELIVERY,
      warehouse,
      driver,
      creator: { id: this.#userId },
    });

    return inbound;
  }

  async addInboundProduct(
    inbound: Inbound,
    productId: number,
    {
      supplierId,
      quantity,
      price,
    }: {
      supplierId?: number;
      price?: string;
      quantity: number;
    },
  ) {
    const product = await this.productsRepo.findOneByOrFail({ id: productId });

    const supplier = supplierId
      ? await this.suppliersRepo.findOneByOrFail({ id: supplierId })
      : null;

    await this.inboundProductsRepo.save<DeepPartial<InboundProduct>>({
      inbound,
      product,
      supplier,
      price,
      requestedQuantity: quantity,
      creator: { id: this.#userId },
    });
  }
}
