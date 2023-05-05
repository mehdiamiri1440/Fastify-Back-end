import AppDataSource from '$src/DataSource';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { OutboundProductManager } from '../OutboundProduct.manager';
import { OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';

const OUTBOUND_INVALID_STATUS = createError(
  'OUTBOUND_INVALID_STATUS',
  'Only draft outbounds can be modified',
  400,
);

const outboundProductsRepo = repo(OutboundProduct);

function fineOne(id: number) {
  return outboundProductsRepo.findOneOrFail({
    where: {
      id,
    },
    relations: {
      outbound: true,
    },
  });
}

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  // PATCH /:id
  app.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        quantity: Type.Optional(Type.Number()),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { outbound } = await fineOne(id);

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundProductsRepo.update(id, req.body);
      return outboundProductsRepo.findOneByOrFail({ id });
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
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const product = await fineOne(id);

      if (product.outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundProductsRepo.softRemove({ id });
      return outboundProductsRepo.findOneOrFail({
        where: { id },
        withDeleted: true,
      });
    },
  });

  async function getSupplyState(id: number, userId: number) {
    const manager = new OutboundProductManager(AppDataSource, id, userId);
    await manager.load();
    return {
      supplied: manager.supplied,
      suppliedQuantity: manager.suppliedQuantity,
      freeQuantity: manager.freeQuantity,
      expectedQuantity: manager.entity.quantity,
      bins: manager.supplyState,
    };
  }

  // GET /:id/supply-state
  app.route({
    method: 'GET',
    url: '/:id/supply-state',
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

    async handler(req) {
      const { id } = req.params;
      return getSupplyState(id, req.user.id);
    },
  });

  // POST /:id/supplies
  app.route({
    method: 'POST',
    url: '/:id/supplies',
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
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    handler: async (req) => {
      await AppDataSource.transaction(async (transactionManager) => {
        const { binId, quantity } = req.body;

        const bin = await transactionManager
          .getRepository(Bin)
          .findOneByOrFail({
            id: binId,
          });

        const manager = new OutboundProductManager(
          transactionManager,
          req.params.id,
          req.user.id,
        );
        await manager.load();
        await manager.supply({ bin, quantity });
      });

      return getSupplyState(req.params.id, req.user.id);
    },
  });

  // DELETE /:id/supplies/:binId
  app.route({
    method: 'DELETE',
    url: '/:id/supplies/:binId',
    schema: {
      params: Type.Object({
        id: Type.Number(),
        binId: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['user@inbound::update'],
        },
      ],
    },
    handler: async (req) => {
      await AppDataSource.transaction(async (transactionManager) => {
        const { id, binId } = req.params;

        const bin = await transactionManager
          .getRepository(Bin)
          .findOneByOrFail({
            id: binId,
          });

        const manager = new OutboundProductManager(
          transactionManager,
          id,
          req.user.id,
        );
        await manager.load();
        await manager.deleteSupply(bin);
      });

      return getSupplyState(req.params.id, req.user.id);
    },
  });
};

export default plugin;
