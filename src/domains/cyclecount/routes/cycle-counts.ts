import AppDataSource from '$src/DataSource';
import { CycleCount } from '$src/domains/cyclecount/models/CycleCount';
import { CycleCountDifference } from '$src/domains/cyclecount/models/Difference';
import {
  CycleCountSchema,
  cycleCountState,
  cycleCountType,
} from '$src/domains/cyclecount/schemas/cyclecount.schema';
import { CycleCountDifferenceSchema } from '$src/domains/cyclecount/schemas/difference.schema';
import { CycleCountService } from '$src/domains/cyclecount/services/cyclecount.service';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Range,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { toTypeOrmFilter } from '$src/infra/tables/filter';
import { toUpperCase } from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'cycleCountState', 'cycleCountType']),
        filter: Filter({
          cycleCountState,
          cycleCountType,
          checker: Type.Object({ fullName: Searchable() }),
          createdAt: Range(Type.String({ format: 'date-time' })),
        }),
      }),
    },
    async handler(req) {
      const { page, pageSize, filter, order, orderBy } = req.query;

      const subQuery = AppDataSource.getRepository(CycleCountDifference)
        .createQueryBuilder('cycle_count_difference')
        .select('COUNT(cycle_count_difference.difference)')
        .where(
          'cycle_count_difference.difference != 0 AND cycle_count_difference.cycle_count_id = cycle_count.id',
        )
        .groupBy('cycle_count_difference.cycle_count_id')
        .getQuery();

      const query = AppDataSource.getRepository(CycleCount)
        .createQueryBuilder('cycle_count')
        .addSelect(`(${subQuery}) AS not_match`)
        .leftJoinAndSelect('cycle_count.bin', 'bin')
        .leftJoinAndSelect('cycle_count.product', 'product')
        .leftJoinAndSelect('cycle_count.checker', 'checker')
        .leftJoinAndSelect('cycle_count.creator', 'creator')
        .where(toTypeOrmFilter(filter ?? {}))
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy(`cycle_count.${orderBy}`, toUpperCase(order));

      const rawAndEntities: { entities: any; raw: any } =
        await query.getRawAndEntities();

      for (const entity of rawAndEntities.entities) {
        const raw = rawAndEntities.raw.find(
          (raw: any) => raw.cycle_count_id === entity.id,
        );
        entity.notMatch = raw.not_match;
      }

      return new PaginatedResponse(rawAndEntities.entities, {
        page: page,
        pageSize: pageSize,
        total: await query.getCount(),
      });
    },
  });
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const cycleCount = await repo(CycleCount).findOneOrFail({
        where: { id: req.params.id },
        relations: {
          bin: { property: true, size: true },
          product: { category: true },
          differences: { binProduct: true },
        },
      });

      for (const index in cycleCount.differences) {
        if (cycleCount.differences[index].quantity == null) {
          cycleCount.differences[index].quantity =
            cycleCount.differences[index].binProduct.quantity;
        }
      }

      return cycleCount;
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::create'],
        },
      ],
      body: Type.Pick(CycleCountSchema, ['cycleCountType', 'bin', 'product']),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new CycleCountService(manager, req.user.id);

        return await service.createWithType(req.body);
      });
    },
  });
  app.route({
    method: 'GET',
    url: '/:id/differences',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::list'],
        },
      ],
      params: Type.Object({ id: Type.Number() }),
    },
    async handler(req) {
      const differences = await AppDataSource.getRepository(
        CycleCountDifference,
      ).find({
        where: { cycleCount: { id: req.params.id } },
        relations: {
          binProduct: { bin: true, product: true },
          cycleCount: { bin: true, product: true },
          counter: true,
        },
      });

      for (const index in differences) {
        if (differences[index].quantity == null) {
          differences[index].quantity = differences[index].binProduct.quantity;
        }
      }
      return differences;
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/differences/:diffId/',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        diffId: Type.Number(),
      }),
      body: Type.Pick(CycleCountDifferenceSchema, ['difference']),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new CycleCountService(manager, req.user.id);

        const difference = await manager
          .getRepository(CycleCountDifference)
          .findOneOrFail({
            where: {
              id: req.params.diffId,
              cycleCount: { id: req.params.id },
            },
            relations: { cycleCount: true },
          });

        await service.changeDiff({ difference, amount: req.body.difference });
      });
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/apply',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new CycleCountService(manager, req.user.id);

        const cycleCount = await manager
          .getRepository(CycleCount)
          .findOneOrFail({
            where: {
              id: req.params.id,
            },
            relations: { checker: true },
          });

        await service.apply({ cycleCount });
      });
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/reject',
    schema: {
      security: [
        {
          OAuth2: ['cycle-count@cycle-count::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await AppDataSource.transaction(async (manager) => {
        const service = new CycleCountService(manager, req.user.id);

        const cycleCount = await manager
          .getRepository(CycleCount)
          .findOneOrFail({
            where: {
              id: req.params.id,
            },
            relations: { checker: true },
          });

        await service.reject({ cycleCount });
      });
    },
  });
};

export default plugin;
