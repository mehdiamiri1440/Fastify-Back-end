import { ShapeSchema } from '$src/domains/configuration/schemas/shape.schema';
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
import { Shape } from '../models/Shape';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Shapes = repo(Shape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@shape::list'],
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
      return new TableQueryBuilder(Shapes, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@shape::create'],
        },
      ],
      body: Type.Pick(ShapeSchema, ['name']),
    },
    async handler(req) {
      return await Shapes.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@shape::update'],
        },
      ],
      body: Type.Pick(ShapeSchema, ['name']),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = await Shapes.findOneByOrFail({ id: req.params.id });
      await Shapes.update({ id }, req.body);
    },
  });
};

export default plugin;
