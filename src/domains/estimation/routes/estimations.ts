import { EstimationSchema } from '$src/domains/estimation/schemas/estimation.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Like } from 'typeorm';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'POST',
    url: '/generic',
    schema: {
      body: Type.Pick(EstimationSchema, [
        'totalProjectCost',
        'costPerKey',
        'costPerSqFt',
        'buildTime',
        'zipCode',
        'rooms',
      ]),
    },
    async handler(req) {
      const { rooms, zipCode } = req.body;
      return { rooms, zipCode };
    },
  });
};

export default plugin;
