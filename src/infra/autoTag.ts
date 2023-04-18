import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { capitalCase } from 'case-anything';

import fp from 'fastify-plugin';

const prefixFormat = /^\/api\/v\d+\//;

const plugin: FastifyPluginAsyncTypebox = async function (fastify) {
  fastify.addHook('onRoute', (route) => {
    if (!route.schema) return;

    // Tags already defined, do nothing
    if (route.schema.tags) return;

    if (!prefixFormat.test(route.path)) return;
    const urlWithoutPrefix = route.path.replace(prefixFormat, '');

    route.schema.tags = [capitalCase(urlWithoutPrefix.split('/')[0])];
  });
};

export default fp(plugin);
