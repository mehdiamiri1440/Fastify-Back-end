import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Category } from '../models/Category';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { CategorySchema } from '$src/domains/configuration/schemas/category.schema';

const Categories = repo(Category);
const plugin: FastifyPluginAsyncTypebox = async function (app) {
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
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
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
        id: Type.Number(),
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
