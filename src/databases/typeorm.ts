import AppDataSource from '$src/DataSource';
import { FastifyPluginCallback } from 'fastify/types/plugin';

const plugin: FastifyPluginCallback = async (fastify, opts, done) => {
  await AppDataSource.initialize();

  fastify.addHook('onClose', async (fastify, done) => {
    await AppDataSource.destroy();
    done();
  });

  done();
};

export default plugin;
