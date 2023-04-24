import { repo } from '$src/infra/utils/repo';
import { Role } from '$src/domains/user/models/Role';
import { User } from '$src/domains/user/models/User';
import fastify, { FastifyInstance, InjectOptions } from 'fastify';
import permissions from '$src/permissions';
import qs from 'qs';

import type Ajv from 'ajv';

async function createTestUser() {
  return await repo(User).save({
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
}

export class TestUser {
  #token: string;
  #app: FastifyInstance;

  static async create(app: FastifyInstance) {
    const token = app.jwt.sign(
      {
        id: (await createTestUser()).id,
        scope: Object.keys(permissions).join(' '),
      },
      {
        expiresIn: 1000,
      },
    );

    return new TestUser(app, token);
  }

  constructor(app: FastifyInstance, token: string) {
    this.#token = token;
    this.#app = app;
  }

  inject(options: InjectOptions) {
    return this.#app.inject({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.#token}`,
      },
    });
  }
}

export async function createTestFastifyApp() {
  const app = fastify({
    querystringParser: (str) => qs.parse(str, { allowDots: true }),
    pluginTimeout: 20000,
    ajv: {
      plugins: [
        (ajv: Ajv) => {
          ajv.addKeyword({ keyword: 'style' });
          ajv.addKeyword({ keyword: 'explode' });
          ajv.addKeyword({ keyword: 'allowReserved' });
        },
      ],
    },
  });
  await app.register(import('$src/databases/typeorm'));
  await app.register(import('@fastify/jwt'), { secret: 'test' });
  await app.register(import('$src/infra/RouteValidator'));
  await app.register(import('$src/infra/authorization'));
  return app;
}
