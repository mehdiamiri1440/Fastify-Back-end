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
import { File } from '$src/domains/files/models/File';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Brands = repo(Brand);
  const Files = repo(File);

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
      return new TableQueryBuilder(Brands, req).relation({ logo: true }).exec();
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
      body: Type.Pick(BrandSchema, ['name', 'logoId']),
    },
    async handler(req) {
      const { name, logoId } = req.body;

      const logo = logoId ? await Files.findOneByOrFail({ id: logoId }) : null;

      return await Brands.save({
        name,
        logo,
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
          OAuth2: ['configuration@brand::update'],
        },
      ],
      body: Type.Pick(BrandSchema, ['name', 'logoId']),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { name, logoId } = req.body;
      const logo = logoId ? await Files.findOneByOrFail({ id: logoId }) : null;

      const { id } = await Brands.findOneByOrFail({ id: req.params.id });

      await Brands.update({ id }, { name, logo });
    },
  });
};

export default plugin;
