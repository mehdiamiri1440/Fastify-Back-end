import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/products'), { prefix: '/products' });
  await app.register(import('./routes/tags'), {
    prefix: '/products',
  });
};

export default plugin;
