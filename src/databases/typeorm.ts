import { models } from '$src/domains/index.js';
import { FastifyPluginCallback } from 'fastify/types/plugin.js';
import { DataSource } from 'typeorm/data-source/DataSource.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'pass',
  database: 'inventory',
  synchronize: true,

  logging: true,
  logger: 'advanced-console',
  dropSchema: true,
  entities: models,
  subscribers: [],
  migrations: [],
});

await AppDataSource.initialize();

const plugin: FastifyPluginCallback = async (fastify, opts, done) => {
  fastify.addHook('onClose', async (fastify, done) => {
    await AppDataSource.close();
  });

  done();
};

export default plugin;
