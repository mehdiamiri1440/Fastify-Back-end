import { ResponseShape } from '$src/infra/Response';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { ProductSupplier } from '../models/ProductSupplier';
import { Product } from '../models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import createError from '@fastify/error';

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

  // POST /products/:id/suppliers
  app.route({
    method: 'POST',
    url: '/products/:id/suppliers',
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

  // DELETE /product-suppliers/:id
  app.route({
    method: 'DELETE',
    url: '/product-suppliers/:id',
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

  // PUT /product-suppliers/:id
  app.route({
    method: 'PUT',
    url: '/product-suppliers/:id',
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
