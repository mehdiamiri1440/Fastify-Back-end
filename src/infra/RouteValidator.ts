import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import permissions from '$src/permissions';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsyncTypebox = async function (fastify) {
  await fastify.addHook('onRoute', (route) => {
    if (route.routePath !== '' && route.routePath !== '/*') {
      if (route.schema === undefined) return;
      if (route.schema.security === undefined) return;

      let scopes: string[] = [];
      for (const index in route.schema.security) {
        if (route.schema.security[index].OAuth2 !== undefined) {
          scopes = route.schema.security[index].OAuth2;
        }
      }
      if (scopes.length <= 0) return;

      // check used scopes is out of permissions or not
      for (const index in scopes) {
        if (!Object.keys(permissions).includes(scopes[index])) {
          throw new Error('you used a scope that not in permissions');
        }
      }
    }
  });
};

export default fp(plugin);
