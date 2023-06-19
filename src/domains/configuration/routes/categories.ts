import { CategorySchema } from '$src/domains/configuration/schemas/category.schema';
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
import { Category } from '../models/Category';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Categories = repo(Category);

  app.register(ResponseShape);
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@category::list'],
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
      return new TableQueryBuilder(Categories, req)
        .relation({
          parent: true,
        })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['configuration@category::create'],
        },
      ],
      body: Type.Pick(CategorySchema, ['name', 'parentId']),
    },
    async handler(req) {
      const { name, parentId } = req.body;

      const parent = parentId
        ? await Categories.findOneByOrFail({ id: parentId })
        : null;

      return await Categories.save({
        name,
        parent,
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['configuration@category::update'],
        },
      ],
      body: Type.Pick(CategorySchema, ['name', 'parentId']),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { name, parentId } = req.body;

      const { id } = await Categories.findOneByOrFail({ id: req.params.id });

      const parent = parentId
        ? await Categories.findOneByOrFail({ id: parentId })
        : null;

      await Categories.update({ id }, { name, parent });
    },
  });
};

export default plugin;
