import { repo } from '$src/databases/typeorm';
import { User } from '$src/domains/user/models/User';
import fastify, { FastifyInstance, InjectOptions } from 'fastify';
import {
  UserExample,
  InputUserExample,
} from '$src/domains/user/schemas/user.schema';
import { Role } from '$src/domains/user/models/Role';
import { InputRoleExample } from '$src/domains/user/schemas/role.schema';
import permissions from '$src/permissions'

async function createTestUser() {
  await repo(Role).save({ ...InputRoleExample });

  return await repo(User).save({
    ...InputUserExample,
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
  const app = fastify();
  await app.register(import('$src/databases/typeorm'));
  await app.register(import('@fastify/jwt'), { secret: 'test' });
  return app;
}
