import qs from 'qs';
import Fastify from 'fastify';

async function main() {
  const fastify = Fastify({
    logger: true,
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 20000,
  });

  await fastify.register(import('./src/app'));

  await fastify.listen({
    port: 3003,
    host: '0.0.0.0',
  });
}

main();
