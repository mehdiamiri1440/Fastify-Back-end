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
    url: '/statistics/suppliers/month',
    schema: {
      security: [
        {
          OAuth2: ['statistics@counts::view'],
        },
      ],
    },
    async handler(req) {
      const subtractMonths = (date: Date, months: number) => {
        // 👇 Make copy with "Date" constructor
        const dateCopy = new Date(date);

        dateCopy.setMonth(dateCopy.getMonth() - months);

        return dateCopy;
      };

      const now = new Date();
      const monthBeforNow = subtractMonths(now, 1);

      const daysQuery = AppDataSource.createQueryBuilder()
        .select('day.date', 'date')
        .addSelect("COALESCE(entity.count, '0')", 'count')
        .from((subQ) => {
          return subQ
            .subQuery()
            .setParameters({
              end: now.toISOString(),
              start: monthBeforNow.toISOString(),
            })
            .select(":start ::date + INTERVAL '1 day' * offs", 'date')
            .from((offsQuery) => {
              return offsQuery
                .subQuery()
                .select(
                  `generate_series(0, (:end ::date - :start ::date) + 1)`,
                  'offs',
                )
                .fromDummy();
            }, 'day');
        }, 'day')
        .leftJoin(
          (subQuery) => {
            return subQuery
              .subQuery()
              .from(Supplier, 'entity')
              .select('COUNT(*)', 'count')
              .addSelect('entity.created_at ::date', 'created_date')
              .where({ createdAt: Between(monthBeforNow, now) })
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
