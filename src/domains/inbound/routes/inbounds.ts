import AppDataSource from '$src/DataSource';
import { User } from '$src/domains/user/models/User';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { IsNull } from 'typeorm';
import { Inbound, InboundStatus, InboundType } from '../models/Inbound';
import { InboundImage } from '../models/InboundImage';
import { InboundProduct } from '../models/InboundProduct';
import { InboundService } from '../services/Inbound.service';
import { loadUserWarehouse } from '../utils';
import {
  INCOMPLETE_LOADING,
  INCOMPLETE_SORTING,
  INVALID_STATUS,
} from '../errors';
import { Nullable, Price, Quantity, StringEnum } from '$src/infra/TypeboxTypes';

const sum = (array: number[]) => array.reduce((a, b) => a + b, 0);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Inbounds = repo(Inbound);
  const InboundProducts = repo(InboundProduct);
  const InboundImages = repo(InboundImage);

  // GET /
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['code', 'status', 'creator.fullName', 'createdAt']),
        filter: Filter({
          status: StringEnum(Object.values(InboundStatus)),
          code: Searchable(),
          creator: Type.Object({
            fullName: Searchable(),
          }),
        }),
      }),
      security: [
        {
          OAuth2: ['user@inbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const userWarehouse = await loadUserWarehouse(req.user.id);

      return new TableQueryBuilder(Inbounds, req)
        .relation({
          creator: true,
          warehouse: true,
        })
        .where(
          where.merge([
            where.from(req),
            {
              warehouse: { id: userWarehouse.id },
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
    handler: async (req) => {
      const { id } = req.params;
      const inbound = await Inbounds.findOneOrFail({
        where: {
          id,
        },

        select: {
          creator: {
            id: true,
            fullName: true,
          },
          products: {
            id: true,
            price: true,
            requestedQuantity: true,
            actualQuantity: true,
            createdAt: true,
            sorted: true,
            product: {
              id: true,
              name: true,
            },
            supplier: {
              id: true,
              name: true,
            },
          },
        },

        relations: {
          creator: true,
          products: {
            product: true,
            supplier: true,
          },
          warehouse: true,
        },
        loadRelationIds: false,
      });
      return inbound;
    },
  });

  app.post('/new', {
    schema: {
      body: Type.Object({
        driverId: Type.Optional(Nullable(Type.Integer())),
        products: Type.Array(
          Type.Object({
            productId: Type.Integer(),
            supplierId: Type.Integer(),
            price: Price(),
            quantity: Quantity(),
          }),
        ),
      }),
      security: [
        {
          OAuth2: ['user@inbound::create'],
        },
      ],
    },
    handler: async (req) => {
      const inbound = await AppDataSource.transaction(async (manager) => {
        const { user, body } = req;
        const inboundService = new InboundService(manager, user.id);

        const warehouse = await loadUserWarehouse(user.id);

        const driver = body.driverId
          ? await manager
              .getRepository(User)
              .findOneByOrFail({ id: body.driverId })
          : null;

        const inbound = await inboundService.create({
          type: InboundType.NEW,
          warehouse,
          driver,
        });

        // Add each product to the inbound record
        for (const productData of body.products) {
          const { productId, supplierId, price, quantity } = productData;

          await inboundService.addInboundProduct(inbound, productId, {
            supplierId,
            price,
            quantity,
          });
        }

        return inbound;
      });

      return Inbounds.findOneByOrFail({ id: inbound.id });
    },
  });

  app.post('/returned', {
    schema: {
      body: Type.Object({
        driverId: Type.Optional(Type.Integer()),
        products: Type.Array(
          Type.Object({
            productId: Type.Integer(),
            quantity: Quantity(),
          }),
        ),
      }),
      security: [
        {
          OAuth2: ['user@inbound::create'],
        },
      ],
    },
    handler: async (req) => {
      const { user, body } = req;

      const inbound = await AppDataSource.transaction(async (manager) => {
        const inboundService = new InboundService(manager, user.id);

        const warehouse = await loadUserWarehouse(user.id);

        const driver = body.driverId
          ? await manager
              .getRepository(User)
              .findOneByOrFail({ id: body.driverId })
          : null;

        const inbound = await inboundService.create({
          type: InboundType.RETURNED,
          warehouse,
          driver,
        });

        // Add each product to the inbound record
        for (const productData of body.products) {
          const { productId, quantity } = productData;
          await inboundService.addInboundProduct(inbound, productId, {
            quantity,
          });
        }

        return inbound;
      });

      return Inbounds.findOneByOrFail({ id: inbound.id });
    },
  });

  // PATCH /:id
  app.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Partial(
        Type.Object({
          creatorSignature: Nullable(Type.String()),
          driverSignature: Nullable(Type.String()),
          description: Nullable(Type.String()),
        }),
      ),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;

      await Inbounds.update(id, req.body);
      return Inbounds.findOneByOrFail({ id });
    },
  });

  // DELETE /{id}
  app.route({
    method: 'DELETE',
    url: '/:id',
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

      const inbound = await Inbounds.findOneOrFail({
        where: {
          id,
        },
        relations: {
          products: true,
        },
      });

      if (inbound.status !== InboundStatus.PRE_DELIVERY) {
        throw new INVALID_STATUS(`only pre-delivery inbounds can be deleted`);
      }

      await AppDataSource.transaction(async (manager) => {
        await manager
          .getRepository(InboundProduct)
          .softRemove(inbound.products);

        await manager.getRepository(Inbound).softRemove(inbound);
      });

      return inbound;
    },
  });

  // GET /:id/images
  app.route({
    method: 'GET',
    url: '/:id/images',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      return InboundImages.find({
        where: {
          inbound: {
            id,
          },
        },
        loadRelationIds: false,
      });
    },
  });

  // POST /:id/images
  app.route({
    method: 'POST',
    url: '/:id/images',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Object({
        fileId: Type.String(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },

    async handler(req) {
      const { id } = req.params;
      const { fileId } = req.body;
      const inbound = await Inbounds.findOneByOrFail({ id });
      return InboundImages.save({
        inbound,
        fileId,
        creator: {
          id: req.user.id,
        },
      });
    },
  });

  // POST /:id/confirm-load
  app.route({
    method: 'POST',
    url: '/:id/confirm-delivery',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = req.params;

      const inbound = await Inbounds.findOneByOrFail({ id });

      if (inbound.status !== InboundStatus.PRE_DELIVERY) {
        throw new INVALID_STATUS(`only pre-delivery inbounds can be confirmed`);
      }

      await Inbounds.update(inbound.id, {
        status: InboundStatus.LOAD,
      });

      return Inbounds.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-load
  app.route({
    method: 'POST',
    url: '/:id/confirm-load',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = req.params;

      const inbound = await Inbounds.findOneByOrFail({ id });

      if (inbound.status !== InboundStatus.LOAD) {
        throw new INVALID_STATUS(`only load inbounds can be confirmed`);
      }

      const inboundProductWithoutActualQuantity = await InboundProducts.findOne(
        {
          where: {
            inbound: {
              id: inbound.id,
            },
            actualQuantity: IsNull(),
          },
        },
      );

      if (inboundProductWithoutActualQuantity) {
        throw new INCOMPLETE_LOADING();
      }

      await Inbounds.update(inbound.id, {
        status: InboundStatus.SORTING,
      });

      return Inbounds.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-sort
  app.route({
    method: 'POST',
    url: '/:id/confirm-sort',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = req.params;

      const inbound = await Inbounds.findOneByOrFail({ id });

      if (inbound.status !== InboundStatus.SORTING) {
        throw new INVALID_STATUS(`only sorting inbounds can be confirmed`);
      }

      // ensure all product sorts are done
      const products = await InboundProducts.find({
        where: {
          inbound: {
            id: inbound.id,
          },
        },
        relations: {
          sorts: true,
        },
      });

      for (const { actualQuantity, sorts } of products) {
        const sortedQuantity = sum(sorts.map((s) => s.quantity));
        if (actualQuantity !== sortedQuantity) throw new INCOMPLETE_SORTING();
      }

      await Inbounds.update(inbound.id, {
        status: InboundStatus.SORTED,
      });

      return Inbounds.findOneByOrFail({ id });
    },
  });
};

export default plugin;
