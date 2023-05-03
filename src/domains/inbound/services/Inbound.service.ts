import {
  DataSource,
  DeepPartial,
  Driver,
  EntityManager,
  Repository,
} from 'typeorm';
import { Inbound, InboundStatus, InboundType } from '../models/Inbound';
import { DocumentService } from '$src/domains/document/service';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import { Product } from '$src/domains/product/models/Product';
import { InboundProduct } from '../models/InboundProduct';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { User } from '$src/domains/user/models/User';

function getCode(id: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counter = (id % 10000).toString().padStart(4, '0');
  return `ASN${date}${counter}`;
}

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
    const inbound = await this.inboundsRepo.save(entity);
    inbound.code = getCode(inbound.id);

    const document = await this.documentService.create({
      type: 'inbound',
      typeId: inbound.id,
    });
    inbound.docId = document.id;

    await this.inboundsRepo.update(inbound.id, inbound);
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
      basePrice,
    }: {
      supplierId?: number;
      quantity: number;
      basePrice: number;
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
      price: basePrice,
      requestedQuantity: quantity,
      creator: { id: this.#userId },
    });
  }
}
