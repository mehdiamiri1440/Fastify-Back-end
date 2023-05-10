import { afterEach, it } from '@jest/globals';
import Fastify from 'fastify';
import App from './app';

const fastify = Fastify({
  pluginTimeout: 20000,
});

afterEach(() => fastify.close());

it('App plugin is working', async () => {
  await fastify.register(App);

  await fastify.ready();
});
