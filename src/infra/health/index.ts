import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox<{ appVersion: string }> =
  async function (fastify, { appVersion }) {
    fastify.route({
      method: 'GET',
      url: '/health',
      handler() {
        return {
          version: appVersion,
          time: Date.now(),
        };
      },
    });
  };

export default plugin;
