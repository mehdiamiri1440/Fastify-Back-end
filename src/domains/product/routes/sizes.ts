import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Size } from '../models/Size';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Sizes = repo(Size);

  // GET /sizes
  app.route({
    method: 'GET',
    url: '/sizes',
    schema: {},
    async handler() {
      return Sizes.find();
    },
  });
};

export default plugin;
