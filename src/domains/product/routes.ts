import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/products'));
  await app.register(import('./routes/tags'));
  await app.register(import('./routes/images'));
  await app.register(import('./routes/suppliers'));
  await app.register(import('./routes/sale-prices'));
};

export default plugin;
