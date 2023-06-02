import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/outbounds'), { prefix: '/outbounds' });
  await app.register(import('./routes/outbound-products'), {
    prefix: '/outbound-products',
  });

  await app.register(import('./routes/customer-outbounds'));
};

export default plugin;
