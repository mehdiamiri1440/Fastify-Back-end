import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Color } from '../models/Color';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Colors = repo(Color);
import { Type } from '@sinclair/typebox';
import { ColorSchema } from '$src/domains/configuration/schemas/color.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['colors'],
      security: [
        {
          OAuth2: ['configuration@color::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Colors, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['colors'],
      security: [
        {
          OAuth2: ['configuration@color::create'],
        },
      ],
      body: Type.Omit(ColorSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      return await Colors.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      tags: ['colors'],
      security: [
        {
          OAuth2: ['configuration@color::update'],
        },
      ],
      body: Type.Omit(ColorSchema, [
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
      return await Colors.update({ id: req.params.id }, req.body);
    },
  });
};

export default plugin;
