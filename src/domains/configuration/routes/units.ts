import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Unit } from '../models/Unit';
import { repo } from '$src/databases/typeorm';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
const Units = repo(Unit);
import { Type } from '@sinclair/typebox';
import { UnitSchema } from '$src/domains/configuration/schemas/unit.schema';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      tags: ['units'],
      security: [
        {
          OAuth2: ['configuration@unit::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Units, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['units'],
      security: [
        {
          OAuth2: ['configuration@unit::create'],
        },
      ],
      body: Type.Omit(UnitSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      return await Units.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      tags: ['units'],
      security: [
        {
          OAuth2: ['configuration@unit::update'],
        },
      ],
      body: Type.Omit(UnitSchema, [
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
      return await Units.update({ id: req.params.id }, req.body);
    },
  });
};

export default plugin;
