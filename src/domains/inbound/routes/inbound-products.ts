import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { InboundStatus } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import { loadUserWarehouse } from '../utils';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Product } from '$src/domains/product/models/Product';
import { InboundProductSort } from '../models/InboundProductSort';
import AppDataSource from '$src/DataSource';
import { repo } from '$src/infra/utils/repo';

const INBOUND_INVALID_STATUS = createError(
  'INBOUND_INVALID_STATUS',
  'Only pre_delivery inbounds can be eddited',
  400,
);

const INVALID_QUANTITY_AMOUNT = createError(
  'INBOUND_INVALID_STATUS',
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

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  // GET /
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['status'],
        orderable: ['code', 'status', 'creator.fullName', 'createdAt'],
        searchable: ['code', 'creator.fullName'],
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
        .select(() => ({
          id: true,
          createdAt: true,
          quantity: true,
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
          inbound: false,
        }))
        .relation(() => ({
          inbound: {
            warehouse: true,
          },
          product: {
            unit: true,
          },
          supplier: true,
        }))
        .where(() =>
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

  // GET /:id
  app.route({
    method: 'GET',
    url: '/:id',
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

  // PATCH /:id
  app.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        price: Type.Optional(Type.Number()),
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
      const inboundProduct = await fineOne(id);

      const allowedStates = [InboundStatus.PRE_DELIVERY, InboundStatus.LOAD];

      if (!allowedStates.includes(inboundProduct.inbound.status)) {
        throw new INBOUND_INVALID_STATUS();
      }

      await InboundProducts.update(inboundProduct.id, req.body);
      return InboundProducts.findOneByOrFail({ id: inboundProduct.id });
    },
  });

  // DELETE /:id
  app.route({
    method: 'DELETE',
    url: '/:id',
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
        throw new INBOUND_INVALID_STATUS();
      }

      await AppDataSource.transaction(async (manager) => {
        await manager.getRepository(InboundProduct).softRemove(inboundProduct);
      });

      return inboundProduct;
    },
  });

  // POST /:id/sorts
  app.route({
    method: 'POST',
    url: '/:id/sorts',
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
        const InboundProducts = manager.getRepository(InboundProduct);
        const InboundProductSorts = manager.getRepository(InboundProductSort);
        const Products = manager.getRepository(Product);

        const Bins = manager.getRepository(Bin);

        const { id } = req.params;
        const { binId, quantity } = req.body;

        const inboundProduct = await InboundProducts.findOneOrFail({
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

        const currentSorted = sum(inboundProduct.sorts.map((e) => e.quantity));
        const currentUnsorted = inboundProduct.actualQuantity - currentSorted;

        if (inboundProduct.inbound.status !== InboundStatus.SORTING) {
          throw new INBOUND_INVALID_STATUS();
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

        const sort = await InboundProductSorts.save({
          inboundProduct,
          bin,
          quantity,
          creator: {
            id: req.user.id,
          },
        });

        // await Products.increment(
        //   {
        //     id: inboundProduct.product.id,
        //   },
        //   'quantity',
        //   quantity,
        // );

        return sort;
      }),
  });

  // DELETE /:id/sorts/:sortId
  app.route({
    method: 'DELETE',
    url: '/:id/sorts/:sortId',
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
        const InboundProducts = manager.getRepository(InboundProduct);
        const InboundProductSorts = manager.getRepository(InboundProductSort);
        const Products = manager.getRepository(Product);

        const { id, sortId } = req.params;

        const inboundProduct = await InboundProducts.findOneOrFail({
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
          throw new INBOUND_INVALID_STATUS();
        }

        await InboundProductSorts.delete({
          id: sortId,
        });

        // await Products.decrement(
        //   {
        //     id: inboundProduct.product.id,
        //   },
        //   'quantity',
        //   sort.quantity,
        // );
      }),
  });
};

export default plugin;