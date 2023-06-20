import { ColorSchema } from '$src/domains/configuration/schemas/color.schema';
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
import { Color } from '../models/Color';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Colors = repo(Color);
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@color::list'],
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
      return new TableQueryBuilder(Colors, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@color::create'],
        },
      ],
      body: Type.Pick(ColorSchema, ['name', 'code']),
    },
    async handler(req) {
      return await Colors.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@color::update'],
        },
      ],
      body: Type.Pick(ColorSchema, ['name', 'code']),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = await Colors.findOneByOrFail({ id: req.params.id });
      await Colors.update({ id }, req.body);
    },
  });
};

export default plugin;
