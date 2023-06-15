import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { Type } from '@sinclair/typebox';
import StringEnum from '$src/infra/utils/StringEnum';
import { Notification } from '$src/domains/notification/models/Notification';
import { notificationSchema } from '$src/domains/notification/schemas/notification.schema';
import AppDataSource from '$src/DataSource';
import { User } from '$src/domains/user/models/User';
import { UserNotification } from '$src/domains/notification/models/UserNotification';

const Notifications = repo(Notification);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['notification@all::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['createdAt']),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Notifications, req).exec();
    },
  });

  app.route({
    method: 'POST',
    url: '/global',
    schema: {
      security: [
        {
          OAuth2: ['notification@global::create'],
        },
      ],
      body: Type.Pick(notificationSchema, ['title', 'detail', 'tag']),
    },

    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const Notifications = manager.getRepository(Notification);
        const notification = await Notifications.save({
          ...req.body,
          creator: { id: req.user.id },
        });

        const users = await manager
          .getRepository(User)
          .createQueryBuilder()
          .getMany();

        const usersNotification = [];
        for (const user of users) {
          usersNotification.push({ user, notification, read: false });
        }
        await manager.getRepository(UserNotification).insert(usersNotification);
        app.io.emit('NOTIFICATIONS_CHANGED');
        return notification;
      });
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id/',
    schema: {
      security: [
        {
          OAuth2: ['notification@specify::delete'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['createdAt']),
      }),
      params: Type.Object({ id: Type.Integer() }),
    },
    async handler(req) {
      const notification = await Notifications.findOneByOrFail({
        id: req.params.id,
      });
      app.io.emit('NOTIFICATIONS_CHANGED');
      await repo(UserNotification).softDelete({
        notification: { id: notification.id },
      });
      await Notifications.softRemove(notification);
    },
  });
};

export default plugin;
