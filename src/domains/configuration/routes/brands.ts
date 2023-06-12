import { BrandSchema } from '$src/domains/configuration/schemas/brand.schema';
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
import { Brand } from '../models/Brand';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Brands = repo(Brand);

  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@brand::list'],
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
      return new TableQueryBuilder(Brands, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@brand::create'],
        },
      ],
      body: Type.Pick(BrandSchema, ['name', 'logoFileId']),
    },
    async handler(req) {
      return await Brands.save({ ...req.body, creator: { id: req.user.id } });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@brand::update'],
        },
      ],
      body: Type.Pick(BrandSchema, ['name', 'logoFileId']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Brands.findOneByOrFail({ id: req.params.id });
      await Brands.update({ id }, req.body);
    },
  });
};

export default plugin;
