import { repo } from '$src/infra/utils/repo';
import { Role } from '$src/domains/user/models/Role';
import { User } from '$src/domains/user/models/User';
import fastify, { FastifyInstance, InjectOptions } from 'fastify';
import permissions from '$src/permissions';
import qs from 'qs';

import type Ajv from 'ajv';
import AppDataSource from '$src/DataSource';
import { ajvOptions } from '$src/AjvOptions';

export async function createTestUser() {
  const user = await repo(User).save({
    firstName: 'tester',
    lastName: 'tester',
    role: await repo(Role).save({
      title: 'tester',
      isActive: true,
    }),
    nif: 'B-6116622G',
    email: 't@est.er',
    phoneNumber: '+989303590054',
    password: 'hackme',
    position: 'tester',
    isActive: true,
  });

  user.fullName = `${user.firstName} ${user.lastName}`;
  return user;
}

export class TestUser {
  token: string;
  #app: FastifyInstance;
  user: User;

  get id() {
    return this.user.id;
  }

  static async create(app: FastifyInstance) {
    const user = await createTestUser();

    const token = app.jwt.sign(
      {
        id: user.id,
        scope: Object.keys(permissions).join(' '),
      },
      {
        expiresIn: 1000,
      },
    );

    return new TestUser(app, token, user);
  }

  constructor(app: FastifyInstance, token: string, user: User) {
    this.token = token;
    this.#app = app;
    this.user = user;
  }

  inject(options: InjectOptions) {
    return this.#app.inject({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}

export async function createTestFastifyApp() {
  const app = fastify({
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 20000,
    ajv: ajvOptions,
  });
  await app.register(import('$src/databases/typeorm'));
  await app.register(import('@fastify/jwt'), { secret: 'test' });
  await app.register(import('$src/infra/RouteValidator'));
  await app.register(import('$src/infra/authorization'));

  // const superErrorHandler = app.errorHandler;
  // app.setErrorHandler((error, request, reply) => {
  //   console.info(request.method, request.url, error);
  //   superErrorHandler(error, request, reply);
  // });
  return app;
}

function disableForeignKeyCheck() {
  return AppDataSource.query(`SET session_replication_role = 'replica';`);
}

function enableForeignKeyCheck() {
  return AppDataSource.query(`SET session_replication_role = 'origin';`);
}

export async function withoutForeignKeyCheck<T>(fnc: () => T): Promise<T> {
  await disableForeignKeyCheck();
  const data = await fnc();
  await enableForeignKeyCheck();
  return data;
}
