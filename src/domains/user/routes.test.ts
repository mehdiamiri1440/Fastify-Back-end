import 'reflect-metadata';
import AppDataSource from '$src/DataSource';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import permissions from '$src/permissions';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { repo } from '$src/infra/utils/repo';
import { Role } from './models/Role';
import routes from './routes';
import exp from 'constants';
import { User } from './models/User';

let app: FastifyInstance | undefined;
let user: TestUser;

let userId: number | undefined;
let roleId: number | undefined;

const userData = {
  firstName: 'Daniel',
  lastName: 'Soheil',
  nif: 'X12345678A',
  email: 'daniel@sohe.ir',
  phoneNumber: '+989303590055',
  password: 'hackme',
  position: 'Developer',
  isActive: true,
};
const roleData = {
  title: 'testRole',
  isActive: true,
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

it('should create a role with permission', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/roles',
    payload: { ...roleData, permissions: ['permission1', 'permission2'] },
  });
  expect(response.json()).toMatchObject({
    data: {
      id: expect.any(Number),
      ...roleData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
  roleId = response.json().data.id;
});

it('should get role by id', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId,
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({
    id: roleId,
    ...roleData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should return all roles', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: roleId,
        ...roleData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should return all permissions added to role and new permission must added', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId + '/permissions',
  });

  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        role: roleId,
        permission: 'permission1',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
      expect.objectContaining({
        role: roleId,
        permission: 'permission2',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should update role and permissions of role', async () => {
  assert(app);
  assert(user);

  roleData.title = 'testRoleEdited';

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + roleId,
    payload: { id: roleId, ...roleData, permissions: [] },
  });

  expect(response.statusCode).toBe(200);
});

it('should get role by id after edit', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId,
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({
    id: roleId,
    ...roleData,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should return all roles after edit', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles',
  });
  expect(response.json().data).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({
        id: roleId,
        ...roleData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should return all permissions after editing role and removed all', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId + '/permissions',
  });

  expect(response.json().data).toMatchObject([]);
});

it('should add permission to role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/roles/' + roleId + '/permissions/testPermission',
  });
  expect(response.json()).toMatchObject({
    data: {
      role: { id: roleId },
      permission: 'testPermission',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});

it('should return all permissions after adding new', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId + '/permissions',
  });

  expect(response.json().data).toMatchObject([
    {
      role: roleId,
      permission: 'testPermission',
    },
  ]);
});

it('should delete permission of role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/roles/' + roleId + '/permissions/testPermission',
  });

  expect(response.statusCode).toBe(200);
});

it('should return all permissions after editing role and removed new', async () => {
  assert(app);
  assert(user);
  assert(roleId);

  const response = await user.inject({
    method: 'GET',
    url: '/roles/' + roleId + '/permissions',
  });

  expect(response.json().data).toMatchObject([]);
});

it('should create a user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/users',
    payload: { ...userData, role: roleId },
  });

  const body = response.json();
  expect(body).toMatchObject({
    data: {
      id: expect.any(Number),
      ...userData,
      role: structuredClone(await repo(Role).findOneBy({ id: roleId })),

      password: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });

  userId = body.data.id;
});

it('should login', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/login',
    payload: {
      username: userData.email,
      password: userData.password,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body).toMatchObject({
    access_token: expect.any(String),
    token_type: 'bearer',
    expires_in: expect.any(Number),
    scope: expect.any(String),
  });
});

it('should not login with wrong password', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/login',
    payload: {
      username: userData.email,
      password: 'wrongpassword',
    },
  });

  expect(response.statusCode).not.toBe(200);
});

it('should deactive user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + userId + '/is-active',
    payload: { isActive: false },
  });

  expect(response.statusCode).toBe(200);
});

it('should not login when user is not active', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/login',
    payload: {
      username: userData.email,
      password: userData.password,
    },
  });

  expect(response.statusCode).not.toBe(200);
});

it('should active user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + userId + '/is-active',
    payload: { isActive: true },
  });

  expect(response.statusCode).toBe(200);
});

it('should deactive role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + roleId + '/is-active',
    payload: { isActive: false },
  });

  expect(response.statusCode).toBe(200);
});

it('should login but with empty scope', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'POST',
    url: '/login',
    payload: {
      username: userData.email,
      password: userData.password,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body).toMatchObject({
    access_token: expect.any(String),
    token_type: 'bearer',
    expires_in: expect.any(Number),
    scope: '',
  });
});

it('should active role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/roles/' + roleId + '/is-active',
    payload: { isActive: true },
  });

  expect(response.statusCode).toBe(200);
});

it('should create and delete a user without phone number', async () => {
  assert(app);
  assert(user);

  const requestBody = {
    firstName: 'Daniel',
    lastName: 'Soheil',
    role: roleId,
    nif: 'X12345678A',
    email: 'daniel2@sohe.ir',
    phoneNumber: null,
    password: 'hackme',
    position: 'Developer',
    isActive: true,
  };

  const createResponse = await user.inject({
    method: 'POST',
    url: '/users',
    payload: requestBody,
  });

  expect(createResponse.statusCode).toBe(200);

  expect(
    await repo(User).findOneBy({ email: requestBody.email }),
  ).toMatchObject({
    phoneNumber: null,
  });

  const deleteResponse = await user.inject({
    method: 'DELETE',
    url: '/users/' + createResponse.json().data.id,
    payload: requestBody,
  });
  expect(deleteResponse.statusCode).toBe(200);
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
        id: userId,
        ...userData,
        role: expect.objectContaining({ id: roleId }),
        password: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      }),
    ]),
  );
});

it('should get user by id', async () => {
  assert(app);
  assert(user);
  assert(userId);

  const response = await user.inject({
    method: 'GET',
    url: '/users/' + userId,
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().data).toMatchObject({
    id: userId,
    ...userData,
    role: { id: roleId },
    password: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    deletedAt: null,
  });
});

it('should update user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'PUT',
    url: '/users/' + userId,
    payload: {
      id: userId,
      ...userData,
      role: roleId,
      firstName: 'DanielEdited',
    },
  });

  expect(response.statusCode).toBe(200);
});

it('should delete user', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/users/' + userId,
  });

  expect(response.statusCode).toBe(200);
});

it('should delete role', async () => {
  assert(app);
  assert(user);

  const response = await user.inject({
    method: 'DELETE',
    url: '/roles/' + roleId,
  });

  expect(response.statusCode).toBe(200);
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
      id: expect.any(Number),
      email: expect.any(String),
      isActive: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    },
    meta: {},
  });
});
