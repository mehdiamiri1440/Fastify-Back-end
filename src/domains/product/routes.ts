import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/products'));
  await app.register(import('./routes/tags'));
  await app.register(import('./routes/images'));
  await app.register(import('./routes/suppliers'));
  await app.register(import('./routes/sale-prices'));
  await app.register(import('./routes/stock-history'));
  await app.register(import('./routes/tax-types'));
  await app.register(import('./routes/bins'));
  await app.register(import('./routes/sizes'));
  await app.register(import('./routes/inbounds'));
  await app.register(import('./routes/content'));
  await app.register(import('./routes/quantity'));
};

export default plugin;
