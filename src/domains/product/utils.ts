import { repo } from '$src/infra/utils/repo';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Category } from '../configuration/models/Category';
import { Color } from '../configuration/models/Color';
import { Unit } from '../configuration/models/Unit';
import { TaxType } from './models/TaxType';

import createError from '@fastify/error';
import { Brand } from '../configuration/models/Brand';
import { Shape } from '../configuration/models/Shape';
import { Size } from './models/Size';
import AppDataSource from '$src/DataSource';
import { Product } from './models/Product';

interface ProductRelationForeignKeys {
  taxTypeId: number;
  unitId: number;
  categoryId: number;
  colorId?: number;
  shapeId?: number;
  sizeId?: number;
  brandId?: number;
}

const TAX_TYPE_NOT_FOUND = createError(
  'TAX_TYPE_NOT_FOUND',
  'tax type not found',
  404,
);

const UNIT_NOT_FOUND = createError('UNIT_NOT_FOUND', 'unit not found', 404);
const SIZE_NOT_FOUND = createError('SIZE_NOT_FOUND', 'size not found', 404);

const COLOR_NOT_FOUND = createError('COLOR_NOT_FOUND', 'color not found', 404);
const SHAPE_NOT_FOUND = createError('SHAPE_NOT_FOUND', 'shape not found', 404);

const CATEGORY_NOT_FOUND = createError(
  'CATEGORY_NOT_FOUND',
  'category not found',
  404,
);

const BRAND_NOT_FOUND = createError('BRAND_NOT_FOUND', 'brand not found', 404);

export async function hydrateProductInfo(product: ProductRelationForeignKeys) {
  const TaxTypes = repo(TaxType);
  const Colors = repo(Color);
  const Units = repo(Unit);
  const Shapes = repo(Shape);
  const Categories = repo(Category);
  const Sizes = repo(Size);
  const Brands = repo(Brand);

  const taxType = await findOneByIdOrFail(
    TaxTypes,
    product.taxTypeId,
    TAX_TYPE_NOT_FOUND,
  );

  const unit = await findOneByIdOrFail(Units, product.unitId, UNIT_NOT_FOUND);
  const category = await findOneByIdOrFail(
    Categories,
    product.categoryId,
    CATEGORY_NOT_FOUND,
  );

  const color = await findOneByIdOrFailNullable(
    Colors,
    product.colorId,
    COLOR_NOT_FOUND,
  );

  const shape = await findOneByIdOrFailNullable(
    Shapes,
    product.shapeId,
    SHAPE_NOT_FOUND,
  );

  const size = await findOneByIdOrFailNullable(
    Sizes,
    product.sizeId,
    SIZE_NOT_FOUND,
  );

  const brand = await findOneByIdOrFailNullable(
    Brands,
    product.brandId,
    BRAND_NOT_FOUND,
  );

  return {
    taxType,
    unit,
    category,
    color,
    shape,
    size,
    brand,
  };
}

async function findOneByIdOrFail<T extends { id: number }>(
  repo: Repository<T>,
  id: number,
  ErrorCtor: new (...args: any[]) => Error,
): Promise<T> {
  const product = await repo.findOneBy({ id } as FindOptionsWhere<T>);
  if (!product) throw new ErrorCtor();
  return product;
}

async function findOneByIdOrFailNullable<T extends { id: number }>(
  repo: Repository<T>,
  id: number | null | undefined,
  ErrorCtor: new (...args: any[]) => Error,
): Promise<T | null> {
  if (!id) return null;
  const product = await repo.findOneBy({ id } as FindOptionsWhere<T>);
  if (!product) throw new ErrorCtor();
  return product;
}
