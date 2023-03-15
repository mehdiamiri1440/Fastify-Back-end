import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

export class Response<D = unknown, M = unknown> {
  data: D;
  meta: M;

  constructor(data: D, meta: M) {
    this.data = data;
    this.meta = meta;
  }
}

export function is2xx(status: number) {
  return status >= 200 && status <= 299;
}

const handler: FastifyPluginCallback = function (app, config, done) {
  app.addHook('preSerialization', (request, response, payload: any, done) => {
    // If the status code is not in the 200 range, return the payload
    if (!is2xx(response.statusCode)) {
      return done(null, payload);
    }
    // If the payload is null, return the payload
    if (!payload) {
      return done(null, payload);
    }
    // If the payload has a pipe method, return the payload
    if ('pipe' in payload) {
      return done(null, payload);
    }
    // If the payload is a Response, return the payload
    if (payload instanceof Response) {
      return done(null, payload);
    }
    // Create a new Response from the payload
    return done(null, new Response(payload, {}));
  });

  done();
};

export const ResponseShape = fp(handler);
