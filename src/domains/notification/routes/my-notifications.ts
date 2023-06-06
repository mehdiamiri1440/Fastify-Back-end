import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { UserNotification } from '$src/domains/notification/models/UserNotification';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { Type } from '@sinclair/typebox';
import StringEnum from '$src/infra/utils/StringEnum';

const UserNotifications = repo(UserNotification);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['createdAt']),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(UserNotifications, req)
        .where({ user: { id: req.user.id } })
        .relation({ notification: true })
        .exec();
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id/',
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({ read: Type.Boolean() }),
    },
    async handler(req) {
      const userNotif = await UserNotifications.findOneByOrFail({
        id: req.params.id,
        user: { id: req.user.id },
      });

      const { read } = req.body;
      await UserNotifications.update(
        { id: userNotif.id },
        {
          read,
        },
      );
    },
  });
};

export default plugin;
