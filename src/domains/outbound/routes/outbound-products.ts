import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';

const OUTBOUND_INVALID_STATUS = createError(
  'OUTBOUND_INVALID_STATUS',
  'Only draft outbounds can be modified',
  400,
);

const outboundsRepo = repo(OutboundProduct);

function fineOne(id: number) {
  return outboundsRepo.findOneOrFail({
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

      await outboundsRepo.update(id, req.body);
      return outboundsRepo.findOneByOrFail({ id });
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

      const product = await fineOne(id);

      if (product.outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundsRepo.softRemove({ id });
      return outboundsRepo.findOneOrFail({ where: { id }, withDeleted: true });
    },
  });
};

export default plugin;
