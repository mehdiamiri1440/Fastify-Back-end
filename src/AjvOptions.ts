import type Ajv from 'ajv';
import { FastifyServerOptions } from 'fastify';

export const ajvOptions = {
  customOptions: {
    removeAdditional: 'all',
  },
  plugins: [
    (ajv: Ajv) => {
      ajv.addKeyword({ keyword: 'style' });
      ajv.addKeyword({ keyword: 'explode' });
      ajv.addKeyword({ keyword: 'allowReserved' });
    },
  ],
} satisfies FastifyServerOptions['ajv'];
