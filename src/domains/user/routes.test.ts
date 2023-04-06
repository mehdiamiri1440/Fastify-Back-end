import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';
import {
  InputUserType,
  InputUserExample,
  UserType,
  UserExample,
} from './schemas/user.schema';
import {
  InputRoleType,
  InputRoleExample,
  RoleType,
  RoleExample,
} from './schemas/role.schema';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;
let userdata: InputUserType | undefined;
let roledata: InputRoleType | undefined;

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
  userdata = {
    ...InputUserExample,
    email: 'other@email.example',
    phoneNumber: '+989303590056',
  };
  roledata = {
    ...InputRoleExample,
    title: 'testRole',
  };
});

afterAll(async () => {
  await app?.close();
});

it('should create a user', async () => {
  assert(app);
  assert(user);
  assert(userdata);

  const response = await user.inject({
    method: 'POST',
    url: '/users',
    payload: userdata,
  });
  userdata.id = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      ...userdata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all users', async () => {
  assert(app);
  assert(user);
  assert(userdata);

  const response = await user.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        ...userdata,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update user', async () => {
  assert(app);
  assert(user);
  assert(userdata);

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + userdata.id,
    payload: { ...userdata, firstName: 'DanielEdited' },
  });

  expect(response.json()).toMatchObject({
    data: {
      generatedMaps: expect.any(Array),
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should deactive user', async () => {
  assert(app);
  assert(user);
  assert(userdata);

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + userdata.id,
    payload: { ...userdata, isActive: false },
  });

  expect(response.json()).toMatchObject({
    data: {
      generatedMaps: expect.any(Array),
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should delete user', async () => {
  assert(app);
  assert(user);
  assert(userdata);

  const response = await user.inject({
    method: 'DELETE',
    url: '/users/' + userdata.id,
    payload: { ...userdata },
  });

  expect(response.json()).toMatchObject({
    data: {
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should create a role', async () => {
  assert(app);
  assert(user);
  assert(roledata);

  const response = await user.inject({
    method: 'POST',
    url: '/roles',
    payload: roledata,
  });
  roledata.id = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      ...roledata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all roles', async () => {
  assert(app);
  assert(user);
  assert(roledata);

  const response = await user.inject({
    method: 'GET',
    url: '/roles',
  });

  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        ...roledata,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update role', async () => {
  assert(app);
  assert(user);
  assert(roledata);

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + roledata.id,
    payload: { ...roledata, title: 'testRoleEdited' },
  });

  expect(response.json()).toMatchObject({
    data: {
      generatedMaps: expect.any(Array),
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should deactive role', async () => {
  assert(app);
  assert(user);
  assert(roledata);

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + roledata.id,
    payload: { ...roledata, isActive: false },
  });

  expect(response.json()).toMatchObject({
    data: {
      generatedMaps: expect.any(Array),
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should delete role', async () => {
  assert(app);
  assert(user);
  assert(roledata);

  const response = await user.inject({
    method: 'DELETE',
    url: '/roles/' + roledata.id,
    payload: { ...roledata },
  });

  expect(response.json()).toMatchObject({
    data: {
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should return a user that logged in', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/whoami',
  });

  expect(response.json()).toMatchObject({
    data: {
      ...UserExample,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});
