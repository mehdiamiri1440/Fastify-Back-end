import { Product } from '$src/domains/product/models/Product';
import { Response, ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductSupplier } from '$src/domains/product/models/ProductSupplier';
import { Supplier } from '$src/domains/supplier/models/Supplier';

const ProductSuppliers = repo(ProductSupplier);
const Suppliers = repo(Supplier);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Products = repo(Product);

  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/products',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['supplier@supplier::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = await Suppliers.findOneByOrFail({ id: req.params.id });

      return ProductSuppliers.find({
        where: {
          supplier: { id },
        },
        relations: {
          product: true,
        },
      });
    },
  });

  app.get('/:id/free-to-add-products', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        pageSize: Type.Integer({ minimum: 1, default: 10 }),
        page: Type.Integer({ minimum: 1, default: 1 }),
      }),
      security: [
        {
          OAuth2: [],
        },
      ],
    },
    async handler(req) {
      const { page, pageSize, search } = req.query;

      // list of all products without products of current supplier
      const [rows, total] = await Products.createQueryBuilder('product')
        .where(
          `product.id NOT IN (
            SELECT product_supplier.product_id 
            FROM product_supplier
            WHERE product_supplier.supplier_id = :supplierId
            AND product_supplier.deleted_at IS NULL
          )`,
        )
        .andWhere(`product.name like :search`, { search: `%${search ?? ''}%` })
        .setParameter('supplierId', req.params.id)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return new Response(rows, {
        page,
        pageSize,
        total,
      });
    },
  });
};

export default plugin;
