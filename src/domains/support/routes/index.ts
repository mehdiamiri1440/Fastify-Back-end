import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  await app.register(import('./support-messages'), {
    prefix: '/support-messages',
  });
};

export default plugin;
