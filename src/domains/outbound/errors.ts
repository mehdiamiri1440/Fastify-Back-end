import createError from '@fastify/error';

export const INVALID_STATUS = createError('INVALID_STATUS', '%s', 400);
export const INVALID_CUSTOMER_ID = createError(
  'INVALID_CUSTOMER_ID',
  'customer with id:%s not found',
  400,
);
export const INVALID_USER_ID = createError(
  'INVALID_USER_ID',
  'user with id:%s not found',
  400,
);
export const NOT_IN_WAREHOUSE = createError(
  'NOT_IN_WAREHOUSE',
  'You are not a warehouse staff',
  403,
);

export const DUPLICATED_PRODUCT_ID = createError(
  'DUPLICATED_PRODUCT_ID',
  'you can not submit the same product twice',
  400,
);

export const ALREADY_SUPPLIED = createError(
  'ALREADY_SUPPLIED',
  'Product is already supplied',
  400,
);

export const INCOMPLETE_SUPPLY = createError(
  'INCOMPLETE_SUPPLY',
  'not all outbound products are supplied',
  400,
);

export const INCOMPLETE_PRODUCT_SUPPLY = createError(
  'INCOMPLETE_PRODUCT_SUPPLY',
  'not all product quantities are supplied from bins',
  400,
);
