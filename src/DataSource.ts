import { models } from '$src/domains/models';
import assert from 'assert';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const { DB_URL, DB_ENABLE_LOGGING, DB_DROP_SCHEMA } = process.env;

assert(DB_URL, 'DB_URL env is required');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: DB_URL,
  synchronize: false,
  logging: DB_ENABLE_LOGGING === 'true',
  dropSchema: DB_DROP_SCHEMA === 'true',
  entities: models,
  subscribers: [],
  ssl: true,
  // ssl: {
  //   rejectUnauthorized: false, // You may want to change this to true in production
  // },
  migrations: ['migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  connectTimeoutMS: 1000000,
});

export default AppDataSource;
