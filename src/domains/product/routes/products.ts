import AppDataSource from '$src/DataSource';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Response, ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { createError } from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import assert from 'assert';
import { DeepPartial, In } from 'typeorm';
import { ProductService } from '../ProductService';
import { Product } from '../models/Product';
import { SourceType } from '../models/ProductStockHistory';
import { ProductSchema } from '../schemas/product.schema';
import { hydrateProductInfo } from '../utils';
import { toTsQuery } from '../utils/tsquery';
import { Nullable } from '$src/infra/utils/Nullable';

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
    unitId: Type.Integer(),
    categoryId: Type.Integer(),
    taxTypeId: Type.Optional(Nullable(Type.Integer())),
    colorId: Type.Optional(Nullable(Type.Integer())),
    shapeId: Type.Optional(Nullable(Type.Integer())),
    sizeId: Type.Optional(Nullable(Type.Integer())),
    brandId: Type.Optional(Nullable(Type.Integer())),
  }),
]);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Products = repo(Product);
  const Bins = repo(Bin);

  app.register(ResponseShape);

  app.get('/products', {
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'name', 'category.name']),
        filter: Filter({
          name: Searchable(),
          category: Filter({
            name: Searchable(),
          }),
        }),
      }),
      security: [
        {
          OAuth2: ['product@product::list'],
        },
      ],
    },
    async handler(req) {
      return new TableQueryBuilder(Products, req)
        .relation({
          category: true,
        })
        .exec();
    },
  });

  // GET /products
  app.route({
    method: 'GET',
    url: '/products/search',
    schema: {
      querystring: Type.Object({
        q: Type.String(),
        page: Type.Integer({ default: 1 }),
        pageSize: Type.Integer({ default: 10 }),
      }),
      security: [
        {
          OAuth2: ['product@product::list'],
        },
      ],
    },
    async handler(req) {
      const { q, page, pageSize } = req.query;

      const [rows, total] = await Products.createQueryBuilder('products')
        .addSelect(
          `ts_rank(to_tsvector('english', search_text), to_tsquery('english', :q))`,
          'rank',
        )
        .orderBy('rank', 'DESC')
        .where('search_text ilike :like')
        .orWhere(
          `to_tsvector('english', search_text) @@ to_tsquery('english', :q)`,
        )
        .setParameters({ q: toTsQuery(q), like: `%${q ?? ''}%` })
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

  // GET /products/:id
  app.route({
    method: 'GET',
    url: '/products/:id',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
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
            id: true,
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
          brand: true,
          productSuppliers: {
            supplier: true,
          },
        },
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      return product;
    },
  });

  app.post('/products', {
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

      const { unit, category, ...optionals } = await hydrateProductInfo({
        taxTypeId,
        colorId,
        unitId,
        categoryId,
        shapeId,
        sizeId,
        brandId,
      });

      assert(unit);
      assert(category);

      const product: DeepPartial<Product> = {
        ...rest,
        unit,
        category,
        ...optionals,
      };

      const { id } = await Products.save(product);
      return Products.findOneOrFail({
        where: { id },
        relations: {
          taxType: true,
          color: true,
          unit: true,
          category: true,
          shape: true,
          size: true,
          brand: true,
        },
      });
    },
  });

  // PATCH /products/:id
  app.route({
    method: 'PATCH',
    url: '/products/:id',
    schema: {
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Partial(InputProduct),
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

      await Products.update({ id: req.params.id }, {
        ...rest,
        ...relations,
      } as Product);

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
      params: Type.Object({ id: Type.Integer() }),
      body: Type.Object({
        binProducts: Type.Array(
          Type.Object({
            binId: Type.Integer(),
            quantity: Type.Integer(),
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
        id: Type.Integer(),
      }),
      body: Type.Object({
        sourceBinId: Type.Integer(),
        targetBinId: Type.Integer(),
        quantity: Type.Integer(),
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
