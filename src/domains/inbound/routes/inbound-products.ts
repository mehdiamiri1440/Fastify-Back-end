import AppDataSource from '$src/DataSource';
import { ProductService } from '$src/domains/product/ProductService';
import { SourceType } from '$src/domains/product/models/ProductStockHistory';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Range,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  BIN_ALREADY_SORTED,
  BIN_FROM_ANOTHER_WAREHOUSE,
  INVALID_QUANTITY_AMOUNT,
  INVALID_STATUS,
} from '../errors';
import { InboundStatus } from '../models/Inbound';
import { InboundProduct } from '../models/InboundProduct';
import { InboundProductSort } from '../models/InboundProductSort';
import { loadUserWarehouse } from '../utils';
import { Price, Quantity } from '$src/infra/TypeboxTypes';
import { InboundProductManager } from '../InboundProduct.manager';

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const InboundProducts = repo(InboundProduct);

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

  app.get('/', {
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy([
          'id',
          'product.name',
          'supplier.name',
          'createdAt',
          'requestedQuantity',
          'actualQuantity',
          'product.unit.name',
        ]),
        filter: Filter({
          product: Filter({
            name: Searchable(),
            unit: Type.Object({
              name: Searchable(),
            }),
          }),
          supplier: Type.Object({
            name: Searchable(),
          }),
          createdAt: Range(Type.String({ format: 'date-time' })),
        }),
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
          inbound: {
            id: true,
            warehouse: {
              id: true,
            },
          },
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
        id: Type.Integer(),
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
        id: Type.Integer(),
      }),
      body: Type.Object({
        price: Type.Optional(Price()),
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
        throw new INVALID_STATUS(
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
        id: Type.Integer(),
      }),
      body: Type.Object({
        actualQuantity: Type.Optional(Quantity()),
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
        throw new INVALID_STATUS(
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
        id: Type.Integer(),
      }),
      body: Type.Object({
        requestedQuantity: Quantity(),
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
        id: Type.Integer(),
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
        throw new INVALID_STATUS(
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
        id: Type.Integer(),
      }),
      body: Type.Object({
        quantity: Quantity(),
        binId: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::sort'],
        },
      ],
    },
    config: {
      possibleErrors: [
        INVALID_STATUS,
        BIN_ALREADY_SORTED,
        INVALID_QUANTITY_AMOUNT,
        BIN_FROM_ANOTHER_WAREHOUSE,
      ],
    },
    handler: (req) =>
      AppDataSource.transaction(async (dataSource) => {
        const { id } = req.params;
        const { binId, quantity } = req.body;

        const manager = new InboundProductManager(dataSource, id, req.user.id);
        const binsRepo = dataSource.getRepository(Bin);

        await manager.load();

        const { inbound } = manager.entity;

        const bin = await binsRepo.findOneOrFail({
          where: {
            id: binId,
          },
          loadRelationIds: {
            disableMixedMap: true,
          },
        });

        if (bin.warehouse.id !== inbound.warehouse.id) {
          throw new BIN_FROM_ANOTHER_WAREHOUSE();
        }

        const sort = await manager.addDraftSort({ bin, quantity });

        return sort;
      }),
  });

  app.delete('/:id/sorts/:binId', {
    schema: {
      params: Type.Object({
        id: Type.Integer(),
        binId: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::sort'],
        },
      ],
    },
    handler: (req) =>
      AppDataSource.transaction(async (dataSource) => {
        const { id, binId } = req.params;

        const manager = new InboundProductManager(dataSource, id, req.user.id);
        const binsRepo = dataSource.getRepository(Bin);

        const bin = await binsRepo.findOneOrFail({
          where: {
            id: binId,
          },
          loadRelationIds: {
            disableMixedMap: true,
          },
        });

        await manager.load();
        const sort = await manager.deleteDraftSort(bin);
        return sort;
      }),
  });
};

export default plugin;
