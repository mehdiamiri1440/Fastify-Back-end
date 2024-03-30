import { ajvOptions } from '$src/AjvOptions';
import Fastify from 'fastify';
import qs from 'qs';

async function main() {
  const fastify = Fastify({
    logger: true,
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 60000,
    ajv: ajvOptions,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3003;

  const appUrl = process.env.APP_URL ?? 'http://aws.raapbuilders.com';

  await fastify.register(import('./src/app'), {
    url: appUrl,
    appVersion: process.env.VERSION ?? '0.0.0',
  });

  await fastify.listen({
    port,
    host: '0.0.0.0',
  });
}

main();
