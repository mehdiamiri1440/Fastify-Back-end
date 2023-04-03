import { repo } from '$src/databases/typeorm';
import { User } from '$src/domains/user/models/User';
import fastify, { FastifyInstance, InjectOptions } from 'fastify';

async function createTestUser() {
  await repo(User).save({
    id: 1,
    firstName: 'd',
    lastName: 'l',
    nif: 6,
    password: 'pass',
    email: 'hi@email.e',
    description: 'desc',
    isActive: true,
  });
}

export class TestUser {
  #token: string;
  #app: FastifyInstance;

  static async create(app: FastifyInstance) {
    await createTestUser();
    const token = app.jwt.sign(
      {
        id: 1,
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
