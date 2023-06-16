import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  await app.register(import('./warehouses'), { prefix: '/warehouses' });
  await app.register(import('./my-warehouse'), { prefix: '/my-warehouse' });
  await app.register(import('./warehouse-staffs'), {
    prefix: '/warehouse-staffs',
  });
  await app.register(import('./bins'));
  await app.register(import('./bin-sizes'), { prefix: '/bin-sizes' });
  await app.register(import('./bin-properties'), {
    prefix: '/bin-properties',
  });
};

export default plugin;
