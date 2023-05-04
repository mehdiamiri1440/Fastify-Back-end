import { Type } from '@sinclair/typebox';
import { repo } from '$src/infra/utils/repo';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { TableQueryBuilder } from '$src/infra/tables/Table';

import { Product } from './models/Product';
import { ProductSalePrice } from './models/ProductSalePrice';
import { TaxType } from './models/TaxType';
import { Color } from '../configuration/models/Color';
import { Unit } from '../configuration/models/Unit';
import { Category } from '../configuration/models/Category';
import { Supplier } from '../supplier/models/Supplier';
import { SupplierProduct } from './models/ProductSupplier';
import { Bin } from '../warehouse/models/Bin';

import { ProductSchema } from './schemas/product.schema';
import { createError } from '@fastify/error';
import { In } from 'typeorm';

import { addProductToBin } from './service';

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
const Suppliers = repo(Supplier);
const SupplierProducts = repo(SupplierProduct);
const ProductSalePrices = repo(ProductSalePrice);
const Bins = repo(Bin);

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
    url: '/',
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
    method: 'POST',
    url: '/:id/init-products',
    schema: {
      tags: ['Product'],
      params: Type.Object({ id: Type.Number() }),
      body: Type.Record(Type.String(), Type.Number()),
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOne({
        where: { id: productId },
        relations: ['movementHistories'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();

      const binsWithQuantities = req.body;
      const binIds = Object.keys(binsWithQuantities);
      const bins = await Bins.findBy({ id: In(binIds) });
      if (binIds.length !== bins.length) throw new BIN_NOT_FOUND();

      if (product.movementHistories.length) throw new CANT_INIT_PRODUCT();

      bins.forEach((bin) => {
        addProductToBin(product, null, bin, binsWithQuantities[bin.id]);
      });

      return product;
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

  app.route({
    method: 'POST',
    url: '/:id/suppliers',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Record(Type.String(), Type.Number()),
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOneBy({ id: productId });
      if (!product) throw new PRODUCT_NOT_FOUND();

      const supplierReferenceCodes = req.body;
      const supplierIds = Array.from(
        new Set(Object.keys(supplierReferenceCodes)),
      );
      const suppliers = await Suppliers.findBy({ id: In(supplierIds) });
      if (suppliers.length !== supplierIds.length)
        throw new SUPPLIER_NOT_FOUND();

      const existRelation = await SupplierProducts.createQueryBuilder(
        'SupplierProduct',
      )
        .where('supplierId IN (:...supplierIds)', { supplierIds })
        .where('productId = :productId', { productId })
        .getOne();

      if (existRelation) throw new SUPPLIER_ALREADY_EXIST();

      return await SupplierProducts.insert(
        suppliers.map((supplier) => ({
          supplier,
          product,
          referenceCode: supplierReferenceCodes[supplier.id],
        })),
      );
    },
  });

  app.route({
    method: 'GET',
    url: '/:id/sale-prices',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOne({
        where: { id: productId },
        relations: ['salePrices'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      const currentPrice = product.salePrices.pop();
      return { currentPrice, history: product.salePrices };
    },
  });

  app.route({
    method: 'POST',
    url: '/:id/sale-prices',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({ price: Type.Number() }),
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOne({
        where: { id: productId },
        relations: ['salePrices'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      return await ProductSalePrices.insert({ product, price: req.body.price });
    },
  });

  app.route({
    method: 'POST',
    url: '/:id/bins',
    schema: {
      tags: ['Product'],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Object({ price: Type.Number() }),
    },
    async handler(req) {
      const productId = req.params.id;
      const product = await Products.findOne({
        where: { id: productId },
        relations: ['salePrices'],
      });
      if (!product) throw new PRODUCT_NOT_FOUND();
      return await ProductSalePrices.insert({ product, price: req.body.price });
    },
  });
};

export default plugin;
