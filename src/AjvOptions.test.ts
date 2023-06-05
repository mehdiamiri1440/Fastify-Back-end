import { it, expect } from '@jest/globals';
import Fastify from 'fastify';
import { ajvOptions } from './AjvOptions';
import { Type } from '@sinclair/typebox';

import '$src/infra/test/statusCodeExpect';

it('Ajv config should remove extra fields', async () => {
  const fastify = Fastify({
    pluginTimeout: 20000,
    ajv: ajvOptions,
  });

  fastify.post('/', {
    schema: {
      body: Type.Object({
        foo: Type.String(),
      }),
    },
    handler(req) {
      return req.body;
    },
  });

  await fastify.ready();

  const response = await fastify.inject({
    method: 'POST',
    url: '/',
    payload: {
      foo: 'bar',
      zar: 'zar',
    },
  });

  expect(response).statusCodeToBe(200);

  expect(response.json()).toEqual({
    foo: 'bar',
  });

  await fastify.close();
});
