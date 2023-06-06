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
