import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { BinPropertySchema } from '../schemas/bin-property.schema';
import { BinProperty } from '$src/domains/warehouse/models/BinProperty';
const BinProperties = repo(BinProperty);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(BinProperties, req).exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await BinProperties.findOneByOrFail({ id: req.params.id });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::create'],
        },
      ],
      body: Type.Pick(BinPropertySchema, ['title']),
    },
    async handler(req) {
      return await BinProperties.save({
        ...req.body,
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
          OAuth2: ['warehouse@bin-property::update'],
        },
      ],
      body: Type.Pick(BinPropertySchema, ['title']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await BinProperties.findOneByOrFail({ id: req.params.id });
      await BinProperties.update({ id }, req.body);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-property::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await BinProperties.findOneByOrFail({ id: req.params.id });
      await BinProperties.delete({ id });
    },
  });
};

export default plugin;
