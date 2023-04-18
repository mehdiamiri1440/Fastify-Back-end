import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Message } from '../models/Message';
import { repo } from '$src/databases/typeorm';

const Messages = repo(Message);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.register(import('./support-messages'), { prefix: '/support-messages' });
};

export default plugin;
