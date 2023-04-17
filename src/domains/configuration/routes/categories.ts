import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Category } from '../models/Category';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Categories = repo(Category);
import { Type } from '@sinclair/typebox';
import { CategorySchema } from '$src/domains/configuration/schemas/category.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
    app.register(ResponseShape);
    app.route({
        method: 'GET',
        url: '/',
        schema: {
            tags: ['categories'],
            security: [
                {
                    OAuth2: ['configuration@category::list'],
                },
            ],
            querystring: ListQueryOptions({
                filterable: ['name'],
                orderable: ['name'],
                searchable: ['name'],
            }),
        },
        async handler(req) {
            return new TableQueryBuilder(Categories, req).exec();
        },
    });
    app.route({
        method: 'POST',
        url: '/',
        schema: {
            tags: ['categories'],
            security: [
                {
                    OAuth2: ['configuration@category::create'],
                },
            ],
            body: Type.Omit(CategorySchema, [
                'id',
                'creator',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ]),
        },
        async handler(req) {
            return await Categories.save({ ...req.body, creator: { id: req.user.id } });
        },
    });
    app.route({
        method: 'PUT',
        url: '/:id',
        schema: {
            tags: ['categories'],
            security: [
                {
                    OAuth2: ['configuration@category::update'],
                },
            ],
            body: Type.Omit(CategorySchema, [
                'id',
                'creator',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ]),
            params: Type.Object({
                id: Type.Number(),
            }),
        },
        async handler(req) {
            return await Categories.update({ id: req.params.id }, req.body);
        },
    });
};

export default plugin;
