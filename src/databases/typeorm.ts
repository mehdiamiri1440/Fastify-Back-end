import { models } from '$src/domains/index';
import assert from 'assert';
import { FastifyPluginCallback } from 'fastify/types/plugin';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { DataSource } from 'typeorm/data-source/DataSource';

const { DB_URL, DB_ENABLE_LOGGING, DB_DROP_SCHEMA } = process.env;

assert(DB_URL, 'DB_URL env is required');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DB_URL,
  synchronize: true,
  logging: DB_ENABLE_LOGGING === 'true',
  dropSchema: DB_DROP_SCHEMA === 'true',
  entities: models,
  subscribers: [],
  migrations: [],
  connectTimeoutMS: 10000,
});

export const repo = <T extends ObjectLiteral>(model: EntityTarget<T>) => {
  return AppDataSource.getRepository<T>(model);
};

const plugin: FastifyPluginCallback = async (fastify, opts, done) => {
  await AppDataSource.initialize();

  fastify.addHook('onClose', async (fastify, done) => {
    await AppDataSource.destroy();
    done();
  });

  done();
};

export default plugin;
