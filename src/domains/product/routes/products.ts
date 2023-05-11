import AppDataSource from '$src/DataSource';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { createError } from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import assert from 'assert';
import { DeepPartial, In } from 'typeorm';
import { ProductService } from '../ProductService';
import { Product } from '../models/Product';
import { ProductSalePrice } from '../models/ProductSalePrice';
import { ProductSchema } from '../schemas/product.schema';
import { hydrateProductInfo } from '../utils';
import { SourceType } from '../models/ProductStockHistory';

const PRODUCT_NOT_FOUND = createError(
  'PRODUCT_NOT_FOUND',
  'product not found',
  404,
);

const BIN_NOT_FOUND = createError('BIN_NOT_FOUND', 'bin not found', 404);

const CANT_INIT_PRODUCT = createError(
  'CANT_INIT_PRODUCT',
  'could not init, initialized product',
  400,
);

const InputProduct = Type.Composite([
  Type.Pick(ProductSchema, [
    'name',
    'barcode',
    'invoiceSystemCode',
    'description',
    'weight',
    'content',
  ]),
  Type.Object({
    unitId: Type.Number(),
    categoryId: Type.Number(),
    taxTypeId: Type.Number(),
    colorId: Type.Optional(Type.Number()),
    shapeId: Type.Optional(Type.Number()),
    sizeId: Type.Optional(Type.Number()),
    brandId: Type.Optional(Type.Number()),
  }),
]);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Products = repo(Product);
  const Bins = repo(Bin);

  app.register(ResponseShape);

  // GET /products
  app.route({
    method: 'GET',
    url: '/products',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: ['name', 'category.name', 'price'],
        searchable: ['name', 'category.name', 'price'],
      }),
      security: [
        {
          OAuth2: ['product@product::list'],
        },
      ],
    },
    async handler(req) {
      return new TableQueryBuilder(Products, req)
        .relation(() => ({
          category: true,
        }))
        .exec();
    },
  });

  // GET /products/:id
  app.route({
    method: 'GET',
    url: '/products/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product::view'],
        },
      ],
    },
    async handler(req) {
      const product = await Products.findOne({
        where: { id: req.params.id },
        select: {
          images: {
            fileId: true,
          },
        },
        relations: {
          taxType: true,
          category: true,
          unit: true,
          color: true,
          images: true,
          shape: true,
          size: true,
          tags: true,
          productSuppliers: {
            supplier: true,
          },
        },
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      return product;
    },
  });

  // POST /products
  app.route({
    method: 'POST',
    url: '/products',
    schema: {
      body: InputProduct,
      security: [
        {
          OAuth2: ['product@product::create'],
        },
      ],
    },

    async handler(req) {
      const {
        taxTypeId,
        colorId,
        unitId,
        categoryId,
        shapeId,
        sizeId,
        brandId,
        ...rest
      } = req.body;

      const relations = await hydrateProductInfo({
        taxTypeId,
        colorId,
        unitId,
        categoryId,
        shapeId,
        sizeId,
        brandId,
      });

      const product: DeepPartial<Product> = {
        ...rest,
        ...relations,
      };

      return await Products.save(product);
    },
  });

  // PUT /products/:id
  app.route({
    method: 'PUT',
    url: '/products/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      body: InputProduct,
      security: [
        {
          OAuth2: ['product@product::update'],
        },
      ],
    },
    async handler(req) {
      const productId = req.params.id;

      const {
        taxTypeId,
        colorId,
        unitId,
        categoryId,
        shapeId,
        sizeId,
        brandId,
        ...rest
      } = req.body;

      const relations = await hydrateProductInfo({
        taxTypeId,
        colorId,
        unitId,
        categoryId,
        shapeId,
        sizeId,
        brandId,
      });

      await Products.update({ id: req.params.id }, { ...rest, ...relations });

      return await Products.findOne({
        where: { id: productId },
        relations: {
          taxType: true,
          category: true,
          unit: true,
          color: true,
        },
      });
    },
  });

  // POST /products/:id/init-bin-products
  app.route({
    method: 'POST',
    url: '/products/:id/init-bin-products',
    schema: {
      params: Type.Object({ id: Type.Number() }),
      body: Type.Object({
        binProducts: Type.Array(
          Type.Object({
            binId: Type.Number(),
            quantity: Type.Number(),
          }),
        ),
      }),
      security: [
        {
          OAuth2: ['product@product::create'],
        },
      ],
    },
    async handler(req) {
      const productId = req.params.id;
      const { binProducts } = req.body;

      const product = await Products.findOne({
        where: { id: productId },
        relations: ['stockHistory'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();

      const binIds = binProducts.map((e) => e.binId);
      const bins = await Bins.findBy({ id: In(binIds) });

      if (binIds.length !== bins.length) throw new BIN_NOT_FOUND();

      if (product.stockHistory.length) throw new CANT_INIT_PRODUCT();

      await AppDataSource.transaction(async (manager) => {
        const productService = new ProductService(manager, req.user.id);

        for (const bin of bins) {
          const quantity = binProducts.find(
            (e) => e.binId === bin.id,
          )?.quantity;

          assert(quantity);
          await productService.addProductToBin({
            product,
            bin,
            quantity,
            description: `init product ${product.name} in bin ${bin.name}`,
            sourceType: SourceType.INIT,
            sourceId: null,
          });
        }
      });

      return product;
    },
  });

  // POST /products/:id/move-bin-quantity
  app.route({
    method: 'POST',
    url: '/products/:id/move-bin-quantity',
    schema: {
      summary: 'move bin quantity from one bin to another',
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({
        sourceBinId: Type.Number(),
        targetBinId: Type.Number(),
        quantity: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['product@product-bins::move'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;
      const { sourceBinId, targetBinId, quantity } = req.body;

      const product = await Products.findOneBy({ id });
      if (!product) throw new PRODUCT_NOT_FOUND();

      const sourceBin = await Bins.findOneByOrFail({ id: sourceBinId });
      const targetBin = await Bins.findOneByOrFail({ id: targetBinId });

      await AppDataSource.transaction(async (manager) => {
        const productService = new ProductService(manager, req.user.id);
        await productService.move(product, sourceBin, targetBin, quantity);
      });
    },
  });
};

export default plugin;
