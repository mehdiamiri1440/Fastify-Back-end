import { UserSchema } from '$src/domains/user/schemas/user.schema';
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
import bcrypt from 'bcrypt';
import { Location } from '../models/Location';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Locations = repo(Location);
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:zipCode',
    schema: {
      params: Type.Object({
        zipCode: Type.Integer(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt']),
      }),
    },
    async handler(req) {
      const { zipCode } = req.params as { zipCode?: number };
      return new TableQueryBuilder(Locations, req).where({ zipCode }).exec();
    },
  });
};

export default plugin;
