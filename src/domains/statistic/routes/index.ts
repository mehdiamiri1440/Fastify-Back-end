import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { repo } from '$src/infra/utils/repo';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Customer } from '$src/domains/customer/models/Customer';
import { Product } from '$src/domains/product/models/Product';
import { Inbound } from '$src/domains/inbound/models/Inbound';
import { Outbound } from '$src/domains/outbound/models/Outbound';
import { Between, QueryBuilder, SelectQueryBuilder } from 'typeorm';
import AppDataSource from '$src/DataSource';
import { QueryString } from '$src/infra/tables/PaginatedType';
import {
  getEntityFromString,
  stringEntitySchema,
} from '$src/domains/statistic/utils';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/statistics',
    schema: {
      security: [
        {
          OAuth2: ['statistics@counts::view'],
        },
      ],
    },
    async handler(req) {
      return {
        suppliers: await repo(Supplier).count(),
        customers: await repo(Customer).count(),
        products: await repo(Product).count(),
        inbounds: await repo(Inbound).count(),
        outbounds: await repo(Outbound).count(),
      };
    },
  });

  app.route({
    method: 'GET',
    url: '/statistics/days',
    schema: {
      security: [
        {
          OAuth2: ['statistics@counts::view'],
        },
      ],
      querystring: QueryString({
        entity: stringEntitySchema,
        filter: Type.Object({
          createdAt: Type.Object({
            $gte: Type.String({ format: 'date' }),
            $lte: Type.String({ format: 'date' }),
          }),
        }),
      }),
    },
    async handler(req) {
      const { filter } = req.query;
      if (!filter.createdAt.$lte)
        filter.createdAt.$lte = new Date().toISOString();

      const daysQuery = AppDataSource.createQueryBuilder()
        .select('day.date', 'date')
        .addSelect("COALESCE(entity.count, '0')", 'count')
        .from((subQ) => {
          return subQ
            .subQuery()
            .setParameters({
              start: filter.createdAt.$gte,
              end: filter.createdAt.$lte,
            })
            .select(":start ::date + INTERVAL '1 day' * offs", 'date')
            .from((offsQuery) => {
              return offsQuery
                .subQuery()
                .select(
                  `generate_series(1, (:end ::date - :start ::date))`,
                  'offs',
                )
                .fromDummy();
            }, 'day');
        }, 'day')
        .leftJoin(
          (subQuery) => {
            return subQuery
              .subQuery()
              .from(getEntityFromString(req.query.entity), 'entity')
              .select('COUNT(*)', 'count')
              .addSelect('entity.created_at ::date', 'created_date')
              .where({
                createdAt: Between(
                  filter.createdAt.$gte,
                  filter.createdAt.$lte,
                ),
              })
              .addGroupBy('created_date');
          },
          'entity',
          'day.date = entity.created_date',
        );
      return await daysQuery.getRawMany();
    },
  });
  1;
};

export default plugin;
