// my-route.js
import fastify from 'fastify';

function buildApp() {
  const app = fastify();

  app.get('/hello', async (request, reply) => {
    return { message: 'Hello World!' };
  });

  return app;
}

module.exports = buildApp;
