import { Type } from '@sinclair/typebox';
import { repo } from '$src/databases/typeorm';

import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TableQueryBuilder } from '$src/infra/tables/Table';

import { Product } from './models/Product';
import { TaxType } from './models/TaxType';
import { Color } from '../configuration/models/Color';
import { Unit } from '../configuration/models/Unit';
import { Category } from '../configuration/models/Category';

import { ProductSchema } from './schemas/product.schema';

import { createError } from '@fastify/error';
const PRODUCT_NOT_FOUND = createError(
  'PRODUCT_NOT_FOUND',
  'product not found',
  404,
);

const TAX_TYPE_NOT_FOUND = createError(
  'TAX_TYPE_NOT_FOUND',
  'tax type not found',
  404,
);

const UNIT_NOT_FOUND = createError('UNIT_NOT_FOUND', 'unit not found', 404);

const COLOR_NOT_FOUND = createError('COLOR_NOT_FOUND', 'color not found', 404);

const CATEGORY_NOT_FOUND = createError(
  'CATEGORY_NOT_FOUND',
  'category not found',
  404,
);

const Products = repo(Product);
const TaxTypes = repo(TaxType);
const Colors = repo(Color);
const Units = repo(Unit);
const Categories = repo(Category);

//remove unnecessary props and add post/update props
const inputProductSchema = Type.Intersect([
  Type.Omit(ProductSchema, [
    'id',
    'creator',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'taxType',
    'size',
    'unit',
    'brand',
    'color',
    'category',
  ]),
  Type.Object({
    taxTypeId: Type.Number(),
    sizeId: Type.Number(),
    unitId: Type.Number(),
    brandId: Type.Number(),
    colorId: Type.Number(),
    categoryId: Type.Number(),
  }),
]);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/products',
    schema: {
      tags: ['Product'],
      querystring: ListQueryOptions({
        filterable: [],
        orderable: [
          'name',
          'basicQuantity',
          'category.name',
          'price',
          'isLocked',
        ],
        searchable: [
          'name',
          'basicQuantity',
          'category.name',
          'price',
          'isLocked',
        ],
      }),
    },
    async handler(req, rep) {
      return new TableQueryBuilder(Products, req)
        .relation(() => ({
          category: true,
        }))
        .exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const product = await Products.findOne({
        where: { id: req.params.id },
        relations: ['taskType', 'category', 'unit', 'color'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      return product;
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      tags: ['Product'],
      body: inputProductSchema,
    },
    async handler(req) {
      const taxType = await TaxTypes.findOneBy({ id: req.body.taxTypeId });
      if (!taxType) throw new TAX_TYPE_NOT_FOUND();

      const color = await Colors.findOneBy({ id: req.body.colorId });
      if (!color) throw new COLOR_NOT_FOUND();

      const unit = await Units.findOneBy({ id: req.body.unitId });
      if (!unit) throw new UNIT_NOT_FOUND();

      const category = await Categories.findOneBy({ id: req.body.categoryId });
      if (!category) throw new CATEGORY_NOT_FOUND();

      const newProduct = await Products.save({
        ...req.body,
        taxType,
        category,
        unit,
        color,
      });

      return newProduct;
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: inputProductSchema,
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOne({ where: { id: productId } });
      if (!product) throw new PRODUCT_NOT_FOUND();

      const taxType = await TaxTypes.findOneBy({ id: req.body.taxTypeId });
      if (!taxType) throw new TAX_TYPE_NOT_FOUND();

      const color = await Colors.findOneBy({ id: req.body.colorId });
      if (!color) throw new COLOR_NOT_FOUND();

      const unit = await Units.findOneBy({ id: req.body.unitId });
      if (!unit) throw new UNIT_NOT_FOUND();

      const category = await Categories.findOneBy({ id: req.body.categoryId });
      if (!category) throw new CATEGORY_NOT_FOUND();

      await Products.update(
        { id: req.params.id },
        { ...req.body, taxType, category, unit, color },
      );

      return await Products.findOne({
        where: { id: productId },
        relations: ['taskType', 'category', 'unit', 'color'],
      });
    },
  });
};

export default plugin;
