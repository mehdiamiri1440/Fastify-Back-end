import AppDataSource from '$src/DataSource';
import { ProductService } from '$src/domains/product/ProductService';
import { SourceType } from '$src/domains/product/models/ProductStockHistory';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { InboundStatus } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import { InboundProductSort } from '../models/InboundProductSort';
import { loadUserWarehouse } from '../services/utils';

const INBOUND_INVALID_STATUS = createError('INBOUND_INVALID_STATUS', '%s', 400);

const INVALID_QUANTITY_AMOUNT = createError(
  'INVALID_QUANTITY_AMOUNT',
  'message',
  400,
);

const BIN_ALREADY_SORTED = createError(
  'BIN_ALREADY_SORTED',
  'Bin already sorted',
  400,
);

const InboundProducts = repo(InboundProduct);

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.get('/', {
    schema: {
      querystring: ListQueryOptions({
        filterable: ['status'],
        orderable: ['id', 'status', 'creator.fullName', 'createdAt'],
        searchable: ['id', 'creator.fullName'],
      }),
      security: [
        {
          OAuth2: ['user@inbound::list'],
        },
      ],
    },

    async handler(req) {
      const userWarehouse = await loadUserWarehouse(req.user.id);

      return new TableQueryBuilder(InboundProducts, req)
        .select({
          id: true,
          createdAt: true,
          requestedQuantity: true,
          actualQuantity: true,
          supplier: {
            id: true,
            name: true,
          },
          product: {
            id: true,
            name: true,
            unit: {
              id: true,
              name: true,
            },
          },
          inbound: {},
        })
        .relation({
          inbound: {
            warehouse: true,
          },
          product: {
            unit: true,
          },
          supplier: true,
        })
        .where(
          where.merge([
            where.from(req),
            {
              inbound: {
                warehouse: { id: userWarehouse.id },
              },
            },
          ]),
        )
        .loadRelationIds(false)
        .exec();
    },
  });

  app.get('/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::list'],
        },
      ],
    },
    handler(req) {
      const { id } = req.params;
      return InboundProducts.findOneOrFail({
        where: {
          id,
        },
        relations: {
          inbound: true,
          sorts: {
            bin: true,
          },
        },
      });
    },
  });

  app.post('/:id/set-price', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        price: Type.Optional(Type.Number()),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const inboundProduct = await fineOne(id);

      if (inboundProduct.inbound.status !== InboundStatus.PRE_DELIVERY) {
        throw new INBOUND_INVALID_STATUS(
          'Only pre_delivery inbounds are allowed to update product prices',
        );
      }

      await InboundProducts.update(inboundProduct.id, req.body);
      return InboundProducts.findOneByOrFail({ id: inboundProduct.id });
    },
  });

  app.post('/:id/set-actual-quantity', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        actualQuantity: Type.Optional(Type.Number()),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { actualQuantity } = req.body;

      const inboundProduct = await fineOne(id);

      if (inboundProduct.inbound.status !== InboundStatus.LOAD) {
        throw new INBOUND_INVALID_STATUS(
          'Only load inbounds are allowed to update actual quantity',
        );
      }

      await InboundProducts.update(inboundProduct.id, { actualQuantity });
      return InboundProducts.findOneByOrFail({ id: inboundProduct.id });
    },
  });

  app.post('/:id/set-requested-quantity', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        requestedQuantity: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { requestedQuantity } = req.body;

      const inboundProduct = await fineOne(id);

      await InboundProducts.update(inboundProduct.id, { requestedQuantity });
      return InboundProducts.findOneByOrFail({ id: inboundProduct.id });
    },
  });

  app.delete('/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::delete'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const inboundProduct = await InboundProducts.findOneOrFail({
        where: {
          id,
        },
        relations: {
          inbound: true,
        },
      });

      if (inboundProduct.inbound.status !== InboundStatus.PRE_DELIVERY) {
        throw new INBOUND_INVALID_STATUS(
          'Only pre_delivery inbounds are allowed to delete',
        );
      }

      await AppDataSource.transaction(async (manager) => {
        await manager.getRepository(InboundProduct).softRemove(inboundProduct);
      });

      return inboundProduct;
    },
  });

  app.post('/:id/sorts', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        quantity: Type.Number(),
        binId: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::sort'],
        },
      ],
    },
    handler: (req) =>
      AppDataSource.transaction(async (manager) => {
        const productsService = new ProductService(manager, req.user.id);
        const inboundProductsRepo = manager.getRepository(InboundProduct);
        const inboundProductSortsRepo =
          manager.getRepository(InboundProductSort);

        const Bins = manager.getRepository(Bin);

        const { id } = req.params;
        const { binId, quantity } = req.body;

        const inboundProduct = await inboundProductsRepo.findOneOrFail({
          where: {
            id,
          },
          relations: {
            inbound: true,
            product: true,
            sorts: {
              bin: true,
            },
          },
        });

        const currentSorted = sum(inboundProduct.sorts.map((e) => e.quantity));
        const currentUnsorted = inboundProduct.actualQuantity - currentSorted;

        if (inboundProduct.inbound.status !== InboundStatus.SORTING) {
          throw new INBOUND_INVALID_STATUS(
            'Only inbounds with sorting state are allowed to sort',
          );
        }

        if (inboundProduct.sorts.find((sort) => sort.bin.id === binId)) {
          throw new BIN_ALREADY_SORTED();
        }

        if (quantity > currentUnsorted) {
          throw new INVALID_QUANTITY_AMOUNT(
            `Current unsorted quantity: ${currentUnsorted}. Can not sort amount: ${quantity}`,
          );
        }

        const bin = await Bins.findOneByOrFail({
          id: binId,
        });

        const sort = await inboundProductSortsRepo.save({
          inboundProduct,
          bin,
          quantity,
          creator: {
            id: req.user.id,
          },
        });

        const productSortComplete = currentUnsorted === quantity;
        if (productSortComplete) {
          inboundProductsRepo.update(inboundProduct.id, {
            sorted: true,
          });
        }

        await productsService.addProductToBin({
          product: inboundProduct.product,
          bin,
          quantity,
          sourceType: SourceType.INBOUND,
          sourceId: inboundProduct.inbound.id,
          description: `Sorted ${quantity} ${inboundProduct.product.name} from inbound id: ${inboundProduct.inbound.id}`,
        });

        return sort;
      }),
  });

  app.delete('/:id/sorts/:sortId', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
        sortId: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::sort'],
        },
      ],
    },
    handler: (req) =>
      AppDataSource.transaction(async (manager) => {
        const productsService = new ProductService(manager, req.user.id);

        const InboundProducts = manager.getRepository(InboundProduct);
        const InboundProductSorts = manager.getRepository(InboundProductSort);

        const { id, sortId } = req.params;

        const inboundProduct = await InboundProducts.findOneOrFail({
          where: {
            id,
          },
          relations: {
            inbound: true,
            product: true,
            sorts: {
              bin: true,
            },
          },
        });

        const sort = await InboundProductSorts.findOneOrFail({
          where: {
            id: sortId,
            inboundProduct: {
              id,
            },
          },
          relations: {
            bin: true,
          },
        });

        if (inboundProduct.inbound.status !== InboundStatus.SORTING) {
          throw new INBOUND_INVALID_STATUS(
            'Only inbounds with sorting state are allowed to unsort',
          );
        }

        await InboundProductSorts.delete({
          id: sortId,
        });

        await InboundProducts.update(inboundProduct.id, {
          sorted: false,
        });

        await productsService.subtractProductFromBin({
          product: inboundProduct.product,
          bin: sort.bin,
          quantity: sort.quantity,
          sourceType: SourceType.INBOUND,
          sourceId: inboundProduct.inbound.id,
          description: `Revert: sorted ${sort.quantity} ${inboundProduct.product.name} from inbound id: ${inboundProduct.inbound.id}`,
        });
      }),
  });
};

function fineOne(id: number) {
  return InboundProducts.findOneOrFail({
    where: {
      id,
    },
    relations: {
      inbound: true,
    },
  });
}

export default plugin;
