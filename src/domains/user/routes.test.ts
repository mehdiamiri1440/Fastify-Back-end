import AppDataSource from '$src/DataSource';
import '$src/infra/test/statusCodeExpect';
import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import permissions from '$src/permissions';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import { Role } from './models/Role';
import { User } from './models/User';
import routes from './routes';
import bcrypt from 'bcrypt';
import { RefreshToken } from '$src/domains/user/models/RefreshToken';
import * as util from 'util';
import { FastifyJWT } from '@fastify/jwt';

let app: FastifyInstance | undefined;
let user: TestUser;

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

it('user flow', async () => {
  assert(app);
  assert(user);
  let userId: number | undefined;
  let roleId: number | undefined;

  {
    // should create a role with permission
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
  }
  {
    // should get role by id
    const response = await user.inject({
      method: 'GET',
      url: '/roles/' + roleId,
    });

    expect(response).statusCodeToBe(200);
    expect(response.json().data).toMatchObject({
      id: roleId,
      ...roleData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should return all roles
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
  }
  {
    // should return all permissions added to role and new permission must added
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
  }
  {
    // should update role and permissions of role
    roleData.title = 'testRoleEdited';

    const response = await user.inject({
      method: 'PUT',
      url: '/roles/' + roleId,
      payload: { id: roleId, ...roleData, permissions: [] },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should get role by id after edit
    const response = await user.inject({
      method: 'GET',
      url: '/roles/' + roleId,
    });

    expect(response).statusCodeToBe(200);
    expect(response.json().data).toMatchObject({
      id: roleId,
      ...roleData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should return all roles after edit
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
  }
  {
    // should return all permissions after editing role and removed all
    const response = await user.inject({
      method: 'GET',
      url: '/roles/' + roleId + '/permissions',
    });

    expect(response.json().data).toMatchObject([]);
  }
  {
    // should add permission to role
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
  }
  {
    // should return all permissions after adding new
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
  }
  {
    // should delete permission of role
    const response = await user.inject({
      method: 'DELETE',
      url: '/roles/' + roleId + '/permissions/testPermission',
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should return all permissions after editing role and removed new
    const response = await user.inject({
      method: 'GET',
      url: '/roles/' + roleId + '/permissions',
    });

    expect(response.json().data).toMatchObject([]);
  }
  {
    // should create a user
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
  }
  {
    // should login
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'password',
        username: userData.email,
        password: userData.password,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      token_type: 'bearer',
      expires_in: expect.any(Number),
      scope: expect.any(String),
    });
  }
  {
    // should not login with wrong password
    const response = await user.inject({
      method: 'POST',
      url: '/login',
      payload: {
        username: userData.email,
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).not.toBe(200);
  }
  {
    // should deactive user
    const response = await user.inject({
      method: 'PUT',
      url: '/users/' + userId + '/is-active',
      payload: { isActive: false },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should not login when user is not active
    const response = await user.inject({
      method: 'POST',
      url: '/login',
      payload: {
        username: userData.email,
        password: userData.password,
      },
    });

    expect(response.statusCode).not.toBe(200);
  }
  {
    // should active user
    const response = await user.inject({
      method: 'PUT',
      url: '/users/' + userId + '/is-active',
      payload: { isActive: true },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should deactive role
    const response = await user.inject({
      method: 'PUT',
      url: '/roles/' + roleId + '/is-active',
      payload: { isActive: false },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should login but with empty scope
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'password',
        username: userData.email,
        password: userData.password,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      token_type: 'bearer',
      expires_in: expect.any(Number),
      scope: '',
    });
  }
  {
    // should active role
    const response = await user.inject({
      method: 'PUT',
      url: '/roles/' + roleId + '/is-active',
      payload: { isActive: true },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create and delete a user without phone number
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
  }
  {
    // should return all users
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
  }
  {
    // should get user by id
    const response = await user.inject({
      method: 'GET',
      url: '/users/' + userId,
    });

    expect(response).statusCodeToBe(200);
    expect(response.json().data).toMatchObject({
      id: userId,
      ...userData,
      role: { id: roleId },
      password: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should update user
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

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete user
    const response = await user.inject({
      method: 'DELETE',
      url: '/users/' + userId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete role
    const response = await user.inject({
      method: 'DELETE',
      url: '/roles/' + roleId,
    });

    expect(response).statusCodeToBe(200);
  }
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

it('auth flow', async () => {
  assert(app);
  assert(user);

  const testEmail = 'test@auth.flow';
  const testPassword = 'testPassword';
  let testRefreshToken: string;

  const testUser = await repo(User).save({
    ...userData,
    email: testEmail,
    phoneNumber: '+989303590057',
    password: await bcrypt.hash(testPassword, 10),
    role: await repo(Role).save({ title: 'testxg', isActive: true }),
  });

  {
    // get tokens with password
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'password',
        username: testEmail,
        password: testPassword,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      token_type: 'bearer',
      expires_in: expect.any(Number),
      scope: expect.any(String),
    });
    testRefreshToken = body.refresh_token;
  }
  {
    // get tokens with refresh token
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'refresh_token',
        refresh_token: testRefreshToken,
      },
    });

    expect(response).statusCodeToBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      access_token: expect.any(String),
      refresh_token: testRefreshToken,
      token_type: 'bearer',
      expires_in: expect.any(Number),
      scope: expect.any(String),
    });
  }
  {
    // should not get access token with invalid refresh token

    await repo(RefreshToken).update(
      {
        jti: ((await app.jwt.verify(testRefreshToken)) as FastifyJWT['payload'])
          .jti,
      },
      {
        valid: false,
      },
    );
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'refresh_token',
        refresh_token: testRefreshToken,
      },
    });

    expect(response).statusCodeToBe(403);
  }
});

it('should not get access_token with random refresh_token or random user/pass', async () => {
  assert(app);
  assert(user);

  {
    // password
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'password',
        username: '34qwtyerg',
        password: '2345awesf',
      },
    });

    expect(response).statusCodeToBe(403);
  }
  {
    // get tokens with refresh token
    const response = await user.inject({
      method: 'POST',
      url: '/token',
      payload: {
        grant_type: 'refresh_token',
        refresh_token: 'asdfefasdf3e9fpasd0f9',
      },
    });

    expect(response).statusCodeToBe(403);
  }
});
