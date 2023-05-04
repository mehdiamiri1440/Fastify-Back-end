import { Product } from '$src/domains/product/models/Product';
import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import fastify from 'fastify';
import { Outbound, OutboundStatus } from '../models/Outbound';
import { OutboundProduct } from '../models/OutboundProduct';
import { loadUserWarehouse } from '../utils';
import AppDataSource from '$src/DataSource';
import { OutboundService } from '../services/outbound.service';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import * as where from '$src/infra/tables/filter';
import createError from '@fastify/error';

const outboundsRepo = repo(Outbound);
const outboundProductRepo = repo(OutboundProduct);
const productRepo = repo(Product);

const OUTBOUND_INVALID_STATUS = createError(
  'OUTBOUND_INVALID_STATUS',
  'Only draft outbounds can be modified',
  400,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  // GET /
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['status'],
        orderable: ['code', 'status', 'creator.fullName', 'createdAt'],
        searchable: ['code', 'creator.fullName'],
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const userWarehouse = await loadUserWarehouse(req.user.id);

      return new TableQueryBuilder(outboundsRepo, req)
        .relation(() => ({
          creator: true,
          warehouse: true,
        }))
        .where(() =>
          where.merge([
            where.from(req),
            {
              warehouse: { id: userWarehouse.id },
            },
          ]),
        )
        .loadRelationIds(false)
        .exec();
    },
  });

  // GET /:id
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::list'],
        },
      ],
    },
    handler: async (req) => {
      const { id } = req.params;
      const inbound = await outboundsRepo.findOneOrFail({
        where: {
          id,
        },

        select: {
          creator: {
            id: true,
            fullName: true,
          },
          products: {
            id: true,
            quantity: true,
            createdAt: true,
            product: {
              id: true,
              name: true,
              unit: {
                id: true,
                name: true,
              },
            },
          },
        },

        relations: {
          creator: true,
          products: {
            product: {
              unit: true,
            },
          },
        },
        loadRelationIds: false,
      });
      return inbound;
    },
  });

  // POST /
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['outbound@outbound::create'],
        },
      ],
      body: Type.Object({
        products: Type.Array(
          Type.Object({
            productId: Type.Integer(),
            quantity: Type.Integer(),
          }),
        ),
      }),
    },

    handler: async (request) => {
      const { body, user } = request;
      const warehouse = await loadUserWarehouse(user.id);

      const outbound = await AppDataSource.transaction(async (manager) => {
        const outboundService = new OutboundService(manager, user.id);

        const outbound = await outboundService.create({
          warehouse,
        });

        for (const item of body.products) {
          await outboundService.addProduct(outbound, item.productId, {
            quantity: item.quantity,
          });
        }

        return outbound;
      });

      return outbound;
    },
  });

  // POST /:id/set-customer
  app.route({
    method: 'POST',
    url: '/:id/set-customer',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        customerId: Type.Optional(Type.Number()),
      }),
      security: [
        {
          OAuth2: ['outbound@outbound::update'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const outbound = await outboundsRepo.findOneByOrFail({ id });

      if (outbound.status !== OutboundStatus.DRAFT) {
        throw new OUTBOUND_INVALID_STATUS();
      }

      await outboundsRepo.update(id, {
        customerId: req.body.customerId,
      });
      return outboundsRepo.findOneByOrFail({ id });
    },
  });
};

export default plugin;
