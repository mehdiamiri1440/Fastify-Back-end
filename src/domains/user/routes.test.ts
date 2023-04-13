import 'reflect-metadata';

import { AppDataSource } from '$src/databases/typeorm';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import permissions from '$src/permissions';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { repo } from '$src/databases/typeorm';
import { Role } from './models/Role';
import routes from './routes';
import { InputRoleExample, InputRoleType } from './schemas/role.schema';
import {
  InputUserExample,
  InputUserType,
  UserExample,
} from './schemas/user.schema';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

let user_id: number;
let role_id: number;
let rp_id: number;

const user_data: InputUserType = {
  ...InputUserExample,
  email: 'other@email.example',
  phoneNumber: '+989303590056',
};
const role_data: InputRoleType = {
  ...InputRoleExample,
  title: 'testRole',
};
const rp_data: { permission: string } = {
  permission: 'testPermission',
};

beforeAll(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
});

afterAll(async () => {
  await app?.close();
});

it('should create a user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/users',
    payload: user_data,
  });
  user_id = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: user_id,
      ...user_data,
      role: JSON.parse(
        JSON.stringify(await repo(Role).findOneBy({ id: user_data.role })),
      ),
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

  const response = await user.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: user_id,
        ...user_data,
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

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + user_id,
    payload: { id: user_id, ...user_data, firstName: 'DanielEdited' },
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

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + user_id,
    payload: { id: user_id, ...user_data, isActive: false },
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

  const response = await user.inject({
    method: 'DELETE',
    url: '/users/' + user_id,
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

  const response = await user.inject({
    method: 'POST',
    url: '/roles',
    payload: role_data,
  });
  role_id = response.json().data.id;
  expect(response.json()).toMatchObject({
    data: {
      id: role_id,
      ...role_data,
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

  const response = await user.inject({
    method: 'GET',
    url: '/roles',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: role_id,
        ...role_data,
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

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + role_id,
    payload: { id: role_id, ...role_data, title: 'testRoleEdited' },
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

it('should add permission to role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/roles/' + role_id + '/permissions/testPermission',
  });
  expect(response.json()).toMatchObject({
    data: {
      role: { id: role_id },
      permission: 'testPermission',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all permissions added to role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + role_id + '/permissions',
  });

  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        role: role_id,
        permission: 'testPermission',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should delete permission of role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/roles/' + role_id + '/permissions/testPermission',
  });

  expect(response.json()).toMatchObject({
    data: {
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should deactive role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + role_id,
    payload: { id: role_id, ...role_data, isActive: false },
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

  const response = await user.inject({
    method: 'DELETE',
    url: '/roles/' + role_id,
  });

  expect(response.json()).toMatchObject({
    data: {
      raw: expect.any(Array),
      affected: 1,
    },
    meta: {},
  });
});

it('should return permissions', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/permissions',
  });

  expect(response.json()).toMatchObject({
    data: permissions,
    meta: {},
  });
});

it('should return a user that logged in', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'GET',
    url: '/users/me',
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
