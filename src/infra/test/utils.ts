import { repo } from '$src/databases/typeorm';
import { Role } from '$src/domains/user/models/Role';
import { User } from '$src/domains/user/models/User';
import { InputRoleExample } from '$src/domains/user/schemas/role.schema';
import {
  InputUserExample,
  UserExample,
} from '$src/domains/user/schemas/user.schema';
import permissions from '$src/permissions';
import fastify, { FastifyInstance, InjectOptions } from 'fastify';
import qs from 'qs';

import type Ajv from 'ajv';

async function createTestUser() {
  return await repo(User).save({
    ...InputUserExample,
    role: await repo(Role).save({ ...InputRoleExample }),
    creator: { id: UserExample.id },
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
  return app;
}
