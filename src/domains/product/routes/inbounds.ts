import { InboundStatus } from '$src/domains/inbound/models/Inbound';
import { InboundProduct } from '$src/domains/inbound/models/InboundProduct';
import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import {
  FastifyPluginAsyncTypebox,
  Type,
} from '@fastify/type-provider-typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const InboundProducts = repo(InboundProduct);

  app.get('/products/:id/inbounds', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id']),
      }),
      security: [
        {
          OAuth2: ['product@inbounds::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return new TableQueryBuilder(InboundProducts, req)
        .relation({
          inbound: true,
          product: true,
          supplier: true,
        })
        .select({
          id: true,
          createdAt: true,
          actualQuantity: true,
          supplier: {
            id: true,
            name: true,
          },
          price: true,
        })
        .where({
          inbound: {
            status: InboundStatus.SORTED,
          },
          product: {
            id,
          },
        })
        .exec();
    },
  });
};

export default plugin;
