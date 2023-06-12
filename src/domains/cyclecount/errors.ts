import createError from '@fastify/error';

export const CYCLE_COUNT_IS_NOT_OPEN = createError(
  'CYCLE_COUNT_IS_NOT_OPEN',
  'this cycle count is not open',
  400,
);
export const MISS_PRODUCT = createError(
  'MISS_PRODUCT',
  'miss product id in cycle count type Product',
  400,
);
export const MISS_BIN = createError(
  'MISS_BIN',
  'miss bin id in cycle count type Bin',
  400,
);
export const EMPTY_BIN = createError(
  'EMPTY_BIN',
  'this bin is empty and we dont have a product in this bin',
  400,
);
export const NOT_IN_ANY_BIN = createError(
  'NOT_IN_ANY_BIN',
  'this product is not in any bin',
  400,
);
