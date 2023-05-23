import type Ajv from 'ajv';
import { FastifyServerOptions } from 'fastify';

export const ajvOptions = {
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
} satisfies FastifyServerOptions['ajv'];
