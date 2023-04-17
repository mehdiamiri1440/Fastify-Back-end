import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.register(import('./units'), { prefix: '/units' });
  app.register(import('./categories'), { prefix: '/categories' });
  app.register(import('./colors'), { prefix: '/colors' });
  app.register(import('./brands'), { prefix: '/brands' });
};

export default plugin;
