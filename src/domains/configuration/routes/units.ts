import { UnitSchema } from '$src/domains/configuration/schemas/unit.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Range,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Unit } from '../models/Unit';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Units = repo(Unit);
  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@unit::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'name']),
        filter: Filter({
          id: Searchable(),
          name: Searchable(),
          createdAt: Range(Type.String({ format: 'date-time' })),
        }),
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
      security: [
        {
          OAuth2: ['configuration@unit::create'],
        },
      ],
      body: Type.Pick(UnitSchema, ['name']),
    },
    async handler(req) {
      return await Units.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@unit::update'],
        },
      ],
      body: Type.Pick(UnitSchema, ['name']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Units.findOneByOrFail({ id: req.params.id });
      await Units.update({ id }, req.body);
    },
  });
};

export default plugin;
