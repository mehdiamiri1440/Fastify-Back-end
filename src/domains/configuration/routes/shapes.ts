import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Shape } from '../models/Shape';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Shapes = repo(Shape);
import { Type } from '@sinclair/typebox';
import { ShapeSchema } from '$src/domains/configuration/schemas/shape.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['shapes'],
      security: [
        {
          OAuth2: ['configuration@shape::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Shapes, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['shapes'],
      security: [
        {
          OAuth2: ['configuration@shape::create'],
        },
      ],
      body: Type.Omit(ShapeSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      return await Shapes.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      tags: ['shapes'],
      security: [
        {
          OAuth2: ['configuration@shape::update'],
        },
      ],
      body: Type.Omit(ShapeSchema, [
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
      return await Shapes.update({ id: req.params.id }, req.body);
    },
  });
};

export default plugin;