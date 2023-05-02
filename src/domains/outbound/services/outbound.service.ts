import { DocumentService } from '$src/domains/document/service';
import { Product } from '$src/domains/product/models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Outbound } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';

function getCode(id: number) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const counter = (id % 10000).toString().padStart(4, '0');
  return `DN${date}${counter}`;
}

export class OutboundService {
  private outboundsRepo: Repository<Outbound>;
  private outboundProductsRepo: Repository<OutboundProduct>;
  private productsRepo: Repository<Product>;

  private documentService: DocumentService;
  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.outboundsRepo = dataSource.getRepository(Outbound);
    this.outboundProductsRepo = dataSource.getRepository(OutboundProduct);
    this.productsRepo = dataSource.getRepository(Product);

    this.documentService = new DocumentService(dataSource, userId);
    this.#userId = userId;
  }

  async #saveOutbound(entity: DeepPartial<Outbound>) {
    const outbound = await this.outboundsRepo.save(entity);
    outbound.code = getCode(outbound.id);

    const document = await this.documentService.create({
      type: 'outbound',
      typeId: outbound.id,
    });
    outbound.docId = document.id;

    await this.outboundsRepo.update(outbound.id, outbound);
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
}
