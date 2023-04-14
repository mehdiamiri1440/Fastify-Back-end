import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import permissions from '$src/permissions';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsyncTypebox = async function (fastify) {
  fastify.addHook('onRoute', (route) => {
    if (!route.schema?.security) return;
    let scopes: string[] = [];
    for (const index in route.schema.security) {
      if (route.schema.security[index].OAuth2 !== undefined) {
        scopes = route.schema.security[index].OAuth2;
      }
    }
    if (scopes.length <= 0) return;
    // check used scopes is out of permissions or not
    for (const scope of scopes) {
      if (!Object.keys(permissions).includes(scope)) {
        throw new Error(`you used ${scope} scope which is not in permissions`);
      }
    }
  });
};

export default fp(plugin);
