import { ResponseShape } from '$src/infra/Response';
import StringEnum from '$src/infra/utils/StringEnum';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import { repo } from '$src/infra/utils/repo';
import {
  FastifyPluginAsyncTypebox,
  Type,
} from '@fastify/type-provider-typebox';
import { Outbound, OutboundStatus, ReceiverType } from '../models/Outbound';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const outboundsRepo = repo(Outbound);

  app.register(ResponseShape);

  app.get('/customers/:id/outbounds', {
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['code', 'status', 'createdAt']),
        filter: Filter({
          status: StringEnum(Object.values(OutboundStatus)),
          code: Searchable(),
        }),
      }),

      security: [
        {
          OAuth2: ['customer@outbound::view'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;

      return new TableQueryBuilder(outboundsRepo, req)
        .where(
          where.merge([
            where.from(req),
            {
              receiverType: ReceiverType.CUSTOMER,
              receiverId: id,
            },
          ]),
        )
        .loadRelationIds(false)
        .exec();
    },
  });
};

export default plugin;
