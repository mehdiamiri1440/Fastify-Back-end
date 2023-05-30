import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/inbounds'), { prefix: '/inbounds' });
  await app.register(import('./routes/inbound-products'), {
    prefix: '/inbound-products',
  });
  await app.register(import('./routes/inbound-images'), {
    prefix: '/inbound-images',
  });
};

export default plugin;
