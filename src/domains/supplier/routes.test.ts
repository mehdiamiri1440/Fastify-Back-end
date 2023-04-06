import 'reflect-metadata';

import { createTestFastifyApp, TestUser } from '$src/infra/test/utils';
import { afterAll, beforeAll, expect, it } from '@jest/globals';
import assert from 'assert';
import fastify, { FastifyInstance } from 'fastify';
import routes from './routes';
import { AppDataSource } from '$src/databases/typeorm';
import { Language } from './models/Language';
import { repo } from '$src/databases/typeorm';

const Languages = repo(Language);
let app: FastifyInstance | undefined;
let user: TestUser | undefined;

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

it('should return all languages', async () => {
    assert(app);
    assert(user);

    const ldata = await Languages.save({ title: 'SPN' });

    const response = await user.inject({
        method: 'GET',
        url: '/languages',
    });

    expect(response.json()).toMatchObject({
        data: [
            {
                ...ldata,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                deletedAt: null,
            },
        ],
        meta: {},
    });
});
