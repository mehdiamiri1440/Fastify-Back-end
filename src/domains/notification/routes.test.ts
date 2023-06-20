import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import '$src/infra/test/statusCodeExpect';
import { Customer } from '$src/domains/customer/models/Customer';
import { Notification } from '$src/domains/notification/models/Notification';
import { UserNotification } from '$src/domains/notification/models/UserNotification';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { NormalUserFactory } from '$src/domains/user/factories/user.factory';
import '$src/infra/test/statusCodeExpect';

let userFactory: NormalUserFactory | undefined;
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
  userFactory = new NormalUserFactory(AppDataSource);
});

afterEach(async () => {
  await app?.close();
});

const newNotification = async () => {
  assert(app);
  assert(user);

  // create notification for all users
  const response = await user.inject({
    method: 'POST',
    url: '/notifications/global',
    payload: {
      title: 'test',
      detail: 'test',
      tag: 'test',
    },
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject(
    expect.objectContaining({
      id: expect.any(Number),
      title: 'test',
      detail: 'test',
      tag: 'test',
    }),
  );
  const notification = await repo(Notification).findOneByOrFail({
    id: response.json().data.id,
  });
  const userNotifications = await repo(UserNotification).find({
    relations: { notification: true },
  });
  expect(userNotifications.length > 0).toBe(true);
  expect(userNotifications).toMatchObject([
    expect.objectContaining({
      notification,
      read: false,
    }),
  ]);
  return notification;
};

const listOfNotifications = async () => {
  assert(app);
  assert(user);
  const newNotif = await newNotification();
  const response = await user.inject({
    method: 'GET',
    url: `/notifications/`,
  });
  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject([
    expect.objectContaining({
      id: newNotif.id,
      title: newNotif.title,
      detail: newNotif.detail,
      tag: newNotif.tag,
    }),
  ]);
  return response.json().data;
};

it('should create new notification', newNotification);
it('should get list of notifications', listOfNotifications);
it('should delete notification', async () => {
  assert(app);
  assert(user);

  const notification = await newNotification();

  const response = await user.inject({
    method: 'DELETE',
    url: `/notifications/${notification.id}/`,
  });
  expect(response).statusCodeToBe(200);
});

it('should get my notifications', async () => {
  assert(app);
  assert(user);
  const notification = await newNotification();
  const response = await user.inject({
    method: 'GET',
    url: `/my-notifications/`,
  });
  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject([
    expect.objectContaining({
      id: expect.any(Number),
      read: false,
      notification: expect.objectContaining({
        id: notification.id,
        title: notification.title,
        detail: notification.detail,
        tag: notification.tag,
      }),
    }),
  ]);
});
it('should mark notification as read and unread', async () => {
  assert(app);
  assert(user);
  const myNotification = await repo(UserNotification).findOneByOrFail({
    notification: { id: (await newNotification()).id },
  });
  expect(myNotification.read).toBe(false);
  {
    // unread to read
    const response = await user.inject({
      method: 'PUT',
      url: `/my-notifications/${myNotification.id}/`,
      payload: { read: true },
    });
    expect(response).statusCodeToBe(200);
    expect(
      (await repo(UserNotification).findOneByOrFail({ id: myNotification.id }))
        .read,
    ).toBe(true);
  }
  {
    // read to unread
    const response = await user.inject({
      method: 'PUT',
      url: `/my-notifications/${myNotification.id}/`,
      payload: { read: false },
    });
    expect(response).statusCodeToBe(200);
    expect(
      (await repo(UserNotification).findOneByOrFail({ id: myNotification.id }))
        .read,
    ).toBe(false);
  }
});
it('should not get others notifications in my notifications', async () => {
  assert(app);
  assert(user);
  assert(userFactory);
  const creator = await userFactory.create();

  const notification1 = await repo(UserNotification).save({
    read: false,
    user: await repo(User).findOneByOrFail({ id: user.id }),
    notification: await repo(Notification).save({
      title: 'title1',
      detail: 'detail1',
      tag: 'tag1',
      creator,
    }),
  });
  const notification2 = await repo(UserNotification).save({
    read: false,
    user: creator,
    notification: await repo(Notification).save({
      title: 'title2',
      detail: 'detail2',
      tag: 'tag2',
      creator,
    }),
  });

  const response1 = await user.inject({
    method: 'GET',
    url: `/my-notifications/`,
  });
  expect(response1.statusCode).toBe(200);
  expect(response1.json()).toMatchObject({
    data: [
      expect.objectContaining({
        id: notification1.id,
        notification: expect.objectContaining({
          id: notification1.notification.id,
        }),
      }),
    ],
    meta: expect.any(Object),
  });
  expect(response1.json()).not.toMatchObject({
    data: [
      expect.objectContaining({
        id: notification2.id,
      }),
    ],
    meta: expect.any(Object),
  });
});
