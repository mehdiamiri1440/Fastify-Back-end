import { models } from '$src/domains/models';
import assert from 'assert';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const { DB_URL, DB_ENABLE_LOGGING, DB_DROP_SCHEMA, DB_ENABLE_SYNCHRONIZE } =
  process.env;

assert(DB_URL, 'DB_URL env is required');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: DB_URL,
  synchronize: DB_ENABLE_SYNCHRONIZE === 'true',
  logging: DB_ENABLE_LOGGING === 'true',
  dropSchema: DB_DROP_SCHEMA === 'true',

  entities: models,
  subscribers: [],
  migrations: ['migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  connectTimeoutMS: 10000,
});

AppDataSource.synchronize();

export default AppDataSource;
