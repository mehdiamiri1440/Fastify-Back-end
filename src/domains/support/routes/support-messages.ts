import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { MessageSchema } from '$src/domains/support/schemas/message.schema';
import { Message } from '../models/Message';
import { repo } from '$src/databases/typeorm';

const Messages = repo(Message);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['support-messages'],
      security: [
        {
          OAuth2: [],
        },
      ],
      body: Type.Omit(MessageSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      return await Messages.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
};

export default plugin;
