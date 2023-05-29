import { afterEach, it } from '@jest/globals';
import Fastify from 'fastify';
import App from './app';
import { ajvOptions } from './AjvOptions';

const fastify = Fastify({
  pluginTimeout: 20000,
  ajv: ajvOptions,
});

afterEach(() => fastify.close());

it('App plugin is working', async () => {
  await fastify.register(App);

  await fastify.ready();
});
