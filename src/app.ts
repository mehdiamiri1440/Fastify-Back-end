import createError from "@fastify/error";
import Fastify from "fastify";
import { TypeORMError } from "typeorm";
import qs from "qs";

const fastify = Fastify({
  logger: true,
  querystringParser: (str) => qs.parse(str, { allowDots: true }),
});

const ENTITY_NOT_FOUND = createError(
  "ENTITY_NOT_FOUND",
  "Entity not found",
  404
);

// fastify.addHook("onResponse", (req, reply, error) => {
//   // handle typeorm not found error
//   if (error instanceof TypeORMError) {
//     const fastifyError = new ENTITY_NOT_FOUND();
//     fastifyError.message = error.message;
//     throw fastifyError;
//   }

//   done(error);
// });

const defaultErrorHandler = fastify.errorHandler;
fastify.setErrorHandler((error, request, reply) => {
  // handle typeorm not found error
  if (error instanceof TypeORMError) {
    const fastifyError = new ENTITY_NOT_FOUND();
    // replace new line and white space
    // also replace quotes
    fastifyError.message = error.message
      .replace(/(\r\n|\n|\r|\s+)/gm, " ")
      .replaceAll("  ", " ")
      .replace(/"/g, "'");
    return defaultErrorHandler(fastifyError, request, reply);
  }

  return defaultErrorHandler(error, request, reply);
});

await fastify.register(import("@fastify/swagger"), {
  openapi: {
    openapi: "3.0.0",
    components: {
      securitySchemes: {
        Bearer: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  },
});

await fastify.register(import("@fastify/swagger-ui"), {
  prefix: "/docs",
  uiConfig: {
    persistAuthorization: true,
  },
});

await fastify.listen({
  port: 3003,
  host: "0.0.0.0",
});
