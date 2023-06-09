import createError from '@fastify/error';
import fp from 'fastify-plugin';

import {
  FastifyPluginCallback,
  RouteOptions,
  onRequestHookHandler,
} from 'fastify';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      tokenType: 'access_token' | 'refresh_token';
      id: number;
      scope?: string;
      time: number;
    }; // payload type is used for signing and verifying
  }
}

const ACCESS_DENIED = createError(
  'ACCESS_DENIED',
  'you do not have access to this resource scope',
  403,
);

const toArray = <T>(input: T | T[]): T[] =>
  Array.isArray(input) ? input : [input];

function createHook(routeOptions: RouteOptions): onRequestHookHandler | null {
  const security = routeOptions.schema?.security;
  if (!security) return null;
  const { OAuth2 } = security[0];
  if (!OAuth2) return null;

  const requiredScopes = OAuth2;

  return async (req, rep) => {
    try {
      await req.jwtVerify();
      if (req.user.tokenType != 'access_token') throw new ACCESS_DENIED();
      const authorizedScopes = req.user.scope?.split(' ') ?? [];
      const hasAccess = requiredScopes.every((requiredScope) =>
        authorizedScopes.includes(requiredScope),
      );

      if (!hasAccess) throw new ACCESS_DENIED();
    } catch (err) {
      rep.send(err);
    }
  };
}

const plugin: FastifyPluginCallback = (app, opt, done) => {
  app.addHook('onRoute', (routeOptions) => {
    const authHook = createHook(routeOptions);

    const onRequestHooks = [
      ...(routeOptions.onRequest ? toArray(routeOptions.onRequest) : []),
    ];

    if (authHook) onRequestHooks.push(authHook);

    routeOptions.onRequest = onRequestHooks;
  });

  done();
};

export default fp(plugin, {
  encapsulate: false,
});
