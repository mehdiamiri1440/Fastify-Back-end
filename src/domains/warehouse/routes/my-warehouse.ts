import { ResponseShape } from '$src/infra/Response';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { WarehouseService } from '../services/Warehouse.service';

export const NOT_IN_WAREHOUSE = createError(
  'NOT_IN_WAREHOUSE',
  'You are not a warehouse staff',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const warehouseService = new WarehouseService();

  app.register(ResponseShape);

  app.get('/', {
    config: {
      possibleErrors: [NOT_IN_WAREHOUSE],
    },
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      tags: ['Warehouses'],
    },

    async handler(req) {
      const warehouse = await warehouseService.findWarehouseOfUser(req.user.id);
      if (!warehouse) throw new NOT_IN_WAREHOUSE();
      return warehouse;
    },
  });
};

export default plugin;
