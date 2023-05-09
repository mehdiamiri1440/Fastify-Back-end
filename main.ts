import qs from 'qs';
import Fastify from 'fastify';
import type Ajv from 'ajv';

async function main() {
  const fastify = Fastify({
    logger: true,
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 20000,
    ajv: {
      customOptions: {
        removeAdditional: true,
      },
      plugins: [
        (ajv: Ajv) => {
          ajv.addKeyword({ keyword: 'style' });
          ajv.addKeyword({ keyword: 'explode' });
          ajv.addKeyword({ keyword: 'allowReserved' });
        },
      ],
    },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3003;
  const appUrl = process.env.APP_URL ?? `http://localhost:${port}`;

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
