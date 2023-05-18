import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Response, ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Product } from '../models/Product';
import { ProductSupplier } from '../models/ProductSupplier';

const SUPPLIER_NOT_FOUND = createError(
  'SUPPLIER_NOT_FOUND',
  'supplier not found',
  404,
);

const SUPPLIER_ALREADY_EXIST = createError(
  'SUPPLIER_ALREADY_EXIST',
  'supplier already exist',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Products = repo(Product);
  const Suppliers = repo(Supplier);
  const ProductSuppliers = repo(ProductSupplier);

  app.register(ResponseShape);

  app.get('/products/:id/free-to-add-suppliers', {
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
          OAuth2: ['product@product-suppliers::create'],
        },
      ],
    },
    async handler(req) {
      const { page, pageSize, search } = req.query;

      // list of all suppliers without suppliers of current product
      const [rows, total] = await Suppliers.createQueryBuilder('supplier')
        .where(
          `supplier.id NOT IN (
            SELECT product_supplier.supplier_id 
            FROM product_supplier
            WHERE product_supplier.product_id = :productId
            AND product_supplier.deleted_at IS NULL
          )`,
        )
        .andWhere(`supplier.name like :search`, { search: `%${search ?? ''}%` })
        .setParameter('productId', req.params.id)
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

  app.post('/products/:id/suppliers', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        supplierId: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product-suppliers::create'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { supplierId } = req.body;

      const product = await Products.findOneByOrFail({ id });

      const supplier = await Suppliers.findOneBy({ id: supplierId });
      if (!supplier) {
        throw new SUPPLIER_NOT_FOUND();
      }

      const alreadyExist = await ProductSuppliers.findOneBy({
        product: {
          id: product.id,
        },
        supplier: {
          id: supplier.id,
        },
      });
      if (alreadyExist) throw new SUPPLIER_ALREADY_EXIST();

      const entity = ProductSuppliers.create({
        product,
        supplier,
        creator: {
          id: req.user.id,
        },
      });

      return ProductSuppliers.save(entity);
    },
  });

  app.delete('/product-suppliers/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product-suppliers::delete'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const entity = await ProductSuppliers.findOneByOrFail({
        id,
      });

      await ProductSuppliers.softDelete(entity.id);
    },
  });

  app.put('/product-suppliers/:id', {
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        referenceCode: Type.String(),
      }),
      security: [
        {
          OAuth2: ['product@product-suppliers::create'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      const entity = await ProductSuppliers.findOneByOrFail({
        id,
      });

      await ProductSuppliers.update(entity.id, req.body);

      return ProductSuppliers.findOneByOrFail({
        id,
      });
    },
  });
};

export default plugin;
