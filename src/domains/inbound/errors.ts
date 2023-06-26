import createError from '@fastify/error';

export const INVALID_STATUS = createError('INVALID_STATUS', '%s', 400);
export const INCOMPLETE_LOADING = createError(
  'INCOMPLETE_LOADING',
  'not all products are loaded completely ',
  400,
);

export const INCOMPLETE_SORTING = createError(
  'INCOMPLETE_SORTING',
  'not all products are sorted completely ',
  400,
);
export const INVALID_QUANTITY_AMOUNT = createError(
  'INVALID_QUANTITY_AMOUNT',
  'message',
  400,
);

export const PRODUCT_ALREADY_SORTED = createError(
  'PRODUCT_ALREADY_SORTED',
  'InboundProduct already sorted',
  400,
);

export const BIN_ALREADY_SORTED = createError(
  'BIN_ALREADY_SORTED',
  'Bin already sorted',
  400,
);

export const NOT_IN_WAREHOUSE = createError(
  'NOT_IN_WAREHOUSE',
  'You are not a warehouse staff',
  403,
);

export const BIN_FROM_ANOTHER_WAREHOUSE = createError(
  'BIN_FROM_ANOTHER_WAREHOUSE',
  'The selected bin is not in your warehouse',
  400,
);

export const DUPLICATED_PRODUCT_ID = createError(
  'DUPLICATED_PRODUCT_ID',
  'you can not submit the same product twice',
  400,
);
