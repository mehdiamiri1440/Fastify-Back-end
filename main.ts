import qs from 'qs';
import Fastify from 'fastify';
import type Ajv from 'ajv';

async function main() {
  const fastify = Fastify({
    logger: true,
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 20000,
    ajv: {
      plugins: [
        (ajv: Ajv) => {
          ajv.addKeyword({ keyword: 'style' });
          ajv.addKeyword({ keyword: 'explode' });
          ajv.addKeyword({ keyword: 'allowReserved' });
        },
      ],
    },
  });

  await fastify.register(import('./src/app'));

  await fastify.listen({
    port: 3003,
    host: '0.0.0.0',
  });
}

main();
