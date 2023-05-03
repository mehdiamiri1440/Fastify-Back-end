import AppDataSource from '$src/DataSource';
import { Product } from '$src/domains/product/models/Product';
import { User } from '$src/domains/user/models/User';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Outbound, OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';
import { OutboundService } from '../services/outbound.service';
import { loadUserWarehouse } from '../utils';

const outboundsRepo = repo(Outbound);
const outboundProductRepo = repo(OutboundProduct);
const usersRepo = repo(User);

const OUTBOUND_INVALID_STATUS = createError(
  'OUTBOUND_INVALID_STATUS',
  'Only draft outbounds can be modified',
  400,
);

const OUTBOUND_INCOMPLETE_SUPPLY = createError(
  'OUTBOUND_INCOMPLETE_SUPPLY',
  'not all outbound products are supplied',
  400,
);

const MISSING_SIGNATURE = createError(
  'MISSING_SIGNATURE',
  'Missing signature',
  400,
);

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
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const userWarehouse = await loadUserWarehouse(req.user.id);

      return new TableQueryBuilder(outboundsRepo, req)
        .relation(() => ({
          creator: true,
          warehouse: true,
        }))
        .where(() =>
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
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;
      const inbound = await outboundsRepo.findOneOrFail({
        where: {
          id,
        },

        select: {
          creator: {
            id: true,
            fullName: true,
          },
          driver: {
            id: true,
            fullName: true,
          },
          products: {
            id: true,
            quantity: true,
            createdAt: true,
            product: {
              id: true,
              name: true,
              quantity: true,
              unit: {
                id: true,
                name: true,
              },
            },
          },
        },

        relations: {
          creator: true,
          driver: true,
          products: {
            product: {
              unit: true,
            },
          },
        },
        loadRelationIds: false,
      });
      return inbound;
    },
  });

  // POST /
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['outbound@outbound::create'],
        },
      ],
      body: Type.Object({
        products: Type.Array(
          Type.Object({
            productId: Type.Integer(),
            quantity: Type.Integer(),
          }),
        ),
      }),
    },

    handler: async (request) => {
      const { body, user } = request;
      const warehouse = await loadUserWarehouse(user.id);

      const outbound = await AppDataSource.transaction(async (manager) => {
        const outboundService = new OutboundService(manager, user.id);

        const outbound = await outboundService.create({
          warehouse,
        });

        for (const item of body.products) {
          await outboundService.addProduct(outbound, item.productId, {
            quantity: item.quantity,
          });
        }

        return outbound;
      });

      return outbound;
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
          OAuth2: ['outbound@outbound::decline'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundsRepo.softDelete(id);
      return outboundsRepo.findOneOrFail({ where: { id }, withDeleted: true });
    },
  });

  // POST /:id/set-customer
  app.route({
    method: 'POST',
    url: '/:id/set-customer',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        customerId: Type.Optional(Type.Number()),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundsRepo.update(id, {
        customerId: req.body.customerId,
      });
      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-order
  app.route({
    method: 'POST',
    url: '/:id/confirm-order',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundsRepo.update(id, {
        status: OutboundStatus.NEW_ORDER,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-supply
  app.route({
    method: 'POST',
    url: '/:id/confirm-supply',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.NEW_ORDER) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      const unSuppliedProduct = await outboundProductRepo.find({
        where: {
          outbound: { id },
          supplied: false,
        },
      });

      if (unSuppliedProduct.length > 0) {
        throw new OUTBOUND_INCOMPLETE_SUPPLY();
      }

      await outboundsRepo.update(id, {
        status: OutboundStatus.TRANSFER,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-transfer
  app.route({
    method: 'POST',
    url: '/:id/confirm-transfer',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneOrFail({
        where: { id },
        relations: {
          driver: true,
        },
      });

      if (outbound.status !== OutboundStatus.TRANSFER) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      const hasDriver = !!outbound.driver;

      const nextStatus = hasDriver
        ? OutboundStatus.PICKING
        : OutboundStatus.DELIVERED;

      if (hasDriver) {
        await outboundsRepo.update(id, {
          status: nextStatus,
        });
      }

      if (!outbound.creatorSignature) {
        throw new OUTBOUND_INCOMPLETE_SUPPLY();
      }

      await outboundsRepo.update(id, {
        status: OutboundStatus.TRANSFER,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/set-driver
  /**
   * This route this receive a driverId or null.
   * if current state of outbound is `Transfer`, then it will change the state of outbound to `Picking`
   * else if user wants to remove the driverId, we will transfer the state back `Transfer`
   */
  app.route({
    method: 'POST',
    url: '/:id/set-driver',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        driverId: Type.Union([Type.Integer(), Type.Null()]),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { driverId } = req.body;

      const outbound = await outboundsRepo.findOneByOrFail({ id });
      const allowedStates = [OutboundStatus.TRANSFER, OutboundStatus.PICKING];
      if (!allowedStates.includes(outbound.status)) {
        throw new OUTBOUND_INVALID_STATUS(
          'outbound state is not TRANSFER or PICKING',
        );
      }

      const driver = driverId
        ? await usersRepo.findOneByOrFail({ id: driverId })
        : null;

      await outboundsRepo.update(outbound.id, {
        driver,
        status: driver ? OutboundStatus.PICKING : OutboundStatus.TRANSFER,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-picking
  app.route({
    method: 'POST',
    url: '/:id/confirm-picking',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const outbound = await outboundsRepo.findOneByOrFail({ id });
      if (outbound.status !== OutboundStatus.PICKING) {
        throw new OUTBOUND_INVALID_STATUS('outbound state is not PICKING');
      }

      if (!outbound.creatorSignature) {
        throw new MISSING_SIGNATURE('Creator signature is required');
      }

      if (!outbound.driverSignature) {
        throw new MISSING_SIGNATURE('Driver signature is required');
      }

      await outboundsRepo.update(outbound.id, {
        status: OutboundStatus.PICKED,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/confirm-picked
  app.route({
    method: 'POST',
    url: '/:id/confirm-picked',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const outbound = await outboundsRepo.findOneByOrFail({ id });
      if (outbound.status !== OutboundStatus.PICKED) {
        throw new OUTBOUND_INVALID_STATUS('outbound state is not PICKED');
      }

      if (!outbound.customerSignature) {
        throw new MISSING_SIGNATURE('Customer signature is required');
      }

      await outboundsRepo.update(outbound.id, {
        status: OutboundStatus.DELIVERED,
      });

      return outboundsRepo.findOneByOrFail({ id });
    },
  });

  // POST /:id/set-creator-signature
  app.route({
    method: 'POST',
    url: '/:id/set-creator-signature',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;

      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        creatorSignature: signature,
      });
    },
  });

  // POST /:id/set-customer-signature
  app.route({
    method: 'POST',
    url: '/:id/set-customer-signature',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        customerSignature: signature,
      });
    },
  });

  // POST /:id/set-driver-signature
  app.route({
    method: 'POST',
    url: '/:id/set-driver-signature',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        signature: Type.String(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { signature } = req.body;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      await outboundsRepo.update(outbound.id, {
        driverSignature: signature,
      });
    },
  });
};

export default plugin;
