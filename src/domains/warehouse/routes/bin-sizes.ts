import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { BinSizeSchema } from '../schemas/bin-size.schema';
import { BinSize } from '$src/domains/warehouse/models/BinSize';
const BinSizes = repo(BinSize);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-size::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['title'],
        orderable: ['title'],
        searchable: ['title'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(BinSizes, req).exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-size::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await BinSizes.findOneByOrFail({ id: req.params.id });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-size::create'],
        },
      ],
      body: Type.Pick(BinSizeSchema, ['title', 'width', 'height', 'depth']),
    },
    async handler(req) {
      return await BinSizes.save({ ...req.body, creator: { id: req.user.id } });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-size::update'],
        },
      ],
      body: Type.Pick(BinSizeSchema, ['title', 'width', 'height', 'depth']),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await BinSizes.findOneByOrFail({ id: req.params.id });
      await BinSizes.update({ id }, req.body);
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@bin-size::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const size = await BinSizes.findOneByOrFail({ id: req.params.id });
      await BinSizes.softRemove(size);
    },
  });
};

export default plugin;
