import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { InboundImage } from '../models/InboundImage';
import { repo } from '$src/infra/utils/repo';

const InboundImages = repo(InboundImage);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  // GET /:id
  app.route({
    method: 'GET',
    url: '/:id',
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
      return InboundImages.findOneOrFail({
        where: {
          id,
        },
      });
    },
  });

  // DELETE /:id
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

      const image = await InboundImages.findOneOrFail({
        where: {
          id,
        },
      });

      await InboundImages.softRemove(image);

      return image;
    },
  });
};

export default plugin;
