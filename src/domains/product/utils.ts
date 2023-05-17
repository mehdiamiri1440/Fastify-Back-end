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

interface ProductRelationForeignKeys {
  unitId?: number;
  categoryId?: number;
  taxTypeId?: number;
  colorId?: number;
  shapeId?: number;
  sizeId?: number;
  brandId?: number;
}

interface HydratedRelations {
  unit?: Unit | null;
  category?: Category | null;
  taxType?: TaxType | null;
  color?: Color | null;
  shape?: Shape | null;
  size?: Size | null;
  brand?: Brand | null;
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

export async function hydrateProductInfo(
  product: ProductRelationForeignKeys,
): Promise<HydratedRelations> {
  const TaxTypes = repo(TaxType);
  const Colors = repo(Color);
  const Units = repo(Unit);
  const Shapes = repo(Shape);
  const Categories = repo(Category);
  const Sizes = repo(Size);
  const Brands = repo(Brand);

  const unit = await findOneByIdOrFailNullable(
    Units,
    product.unitId,
    UNIT_NOT_FOUND,
  );
  const category = await findOneByIdOrFailNullable(
    Categories,
    product.categoryId,
    CATEGORY_NOT_FOUND,
  );

  const taxType = await findOneByIdOrFailNullable(
    TaxTypes,
    product.taxTypeId,
    TAX_TYPE_NOT_FOUND,
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

  return cleanObject({
    taxType,
    unit,
    category,
    color,
    shape,
    size,
    brand,
  });
}

// async function findOneByIdOrFail<T extends { id: number }>(
//   repo: Repository<T>,
//   id: number,
//   ErrorCtor: new (...args: any[]) => Error,
// ): Promise<T> {
//   const product = await repo.findOneBy({ id } as FindOptionsWhere<T>);
//   if (!product) throw new ErrorCtor();
//   return product;
// }

async function findOneByIdOrFailNullable<T extends { id: number }>(
  repo: Repository<T>,
  id: number | null | undefined,
  ErrorCtor: new (...args: any[]) => Error,
): Promise<T | null | undefined> {
  if (id === null) return null;
  if (id === undefined) return;
  const product = await repo.findOneBy({ id } as FindOptionsWhere<T>);
  if (!product) throw new ErrorCtor();
  return product;
}

function cleanObject(o: {
  [key in keyof HydratedRelations]: HydratedRelations[key] | undefined;
}): HydratedRelations {
  for (const key in o) {
    if (o[key as keyof HydratedRelations] === undefined)
      delete o[key as keyof HydratedRelations];
  }

  return o as HydratedRelations;
}
