import AppDataSource from '$src/DataSource';
import { FastifyPluginCallback } from 'fastify/types/plugin';

const { DB_ENABLE_SYNCHRONIZE, DB_RUN_MIGRATIONS } = process.env;

async function createFormatDateFunction() {
  await AppDataSource.query(`
    CREATE OR REPLACE FUNCTION immutable_format_date(timestamp) RETURNS text AS
      $$ select to_char($1, 'YYYYMMDD'); $$
    LANGUAGE sql immutable;
`);
}

const plugin: FastifyPluginCallback = async (fastify, opts, done) => {
  await AppDataSource.initialize();
  await createFormatDateFunction();

  if (DB_ENABLE_SYNCHRONIZE === 'true') {
    await AppDataSource.synchronize();
  }

  if (DB_RUN_MIGRATIONS === 'true') {
    await AppDataSource.runMigrations();
  }

  fastify.addHook('onClose', async (fastify, done) => {
    await AppDataSource.destroy();
    done();
  });

  done();
};

export default plugin;
