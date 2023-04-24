import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  await app.register(import('./units'), { prefix: '/units' });
  await app.register(import('./categories'), { prefix: '/categories' });
  await app.register(import('./colors'), { prefix: '/colors' });
  await app.register(import('./brands'), { prefix: '/brands' });
  await app.register(import('./shapes'), { prefix: '/shapes' });
};

export default plugin;
