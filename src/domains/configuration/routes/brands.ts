import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Brand } from '../models/Brand';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Brands = repo(Brand);
import { Type } from '@sinclair/typebox';
import { BrandSchema } from '$src/domains/configuration/schemas/brand.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
    app.register(ResponseShape);
    app.route({
        method: 'GET',
        url: '/',
        schema: {
            tags: ['brands'],
            security: [
                {
                    OAuth2: ['configuration@brand::list'],
                },
            ],
            querystring: ListQueryOptions({
                filterable: ['name'],
                orderable: ['name'],
                searchable: ['name'],
            }),
        },
        async handler(req) {
            return new TableQueryBuilder(Brands, req).exec();
        },
    });
    app.route({
        method: 'POST',
        url: '/',
        schema: {
            tags: ['brands'],
            security: [
                {
                    OAuth2: ['configuration@brand::create'],
                },
            ],
            body: Type.Omit(BrandSchema, [
                'id',
                'creator',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ]),
        },
        async handler(req) {
            return await Brands.save({ ...req.body, creator: { id: req.user.id } });
        },
    });
    app.route({
        method: 'PUT',
        url: '/:id',
        schema: {
            tags: ['brands'],
            security: [
                {
                    OAuth2: ['configuration@brand::update'],
                },
            ],
            body: Type.Omit(BrandSchema, [
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
            return await Brands.update({ id: req.params.id }, req.body);
        },
    });
};

export default plugin;
