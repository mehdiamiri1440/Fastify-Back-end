import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import Docs from '$src/infra/docs';
import { join } from 'node:path';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  await app.register(import('fastify-socket.io'));
  await app.register(Docs, {
    path: join(__dirname, './docs.md'),
  });
  await app.register(import('./my-notifications'), {
    prefix: '/my-notifications',
  });
  await app.register(import('./notifications'), {
    prefix: '/notifications',
  });
};

export default plugin;
