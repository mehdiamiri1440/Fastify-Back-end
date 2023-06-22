import { Bin } from '$src/domains/warehouse/models/Bin';
import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import {
  FastifyPluginAsyncTypebox,
  Type,
} from '@fastify/type-provider-typebox';
import { BinProduct } from '../models/BinProduct';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const binProductsRepo = repo(BinProduct);

  app.get('/warehouses/:warehouseId/products/:productId/quantity', {
    schema: {
      summary: 'Get the quantity of a product in a warehouse',
      tags: ['Products'],
      params: Type.Object({
        productId: Type.Integer(),
        warehouseId: Type.Integer(),
      }),
      security: [{ OAuth2: [] }],
    },
    async handler(req) {
      const { warehouseId, productId } = req.params;

      const result = await binProductsRepo
        .createQueryBuilder('bin_product')
        .select('SUM(bin_product.quantity)', 'quantity')
        .leftJoin('bin_product.bin', 'bin')
        .where('bin_product.product_id = :productId', { productId })
        .andWhere('bin.warehouse_id = :warehouseId', { warehouseId })
        .getRawOne();

      return {
        quantity: Number(result.quantity) ?? 0,
      };
    },
  });
};

export default plugin;
