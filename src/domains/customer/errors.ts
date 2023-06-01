import createError from '@fastify/error';

export const NOT_NEED_BUSINESS_DATA = createError(
  'NOT_NEED_BUSINESS_DATA',
  'this subscriber type not need business data',
  409,
);
export const NEED_BUSINESS_DATA = createError(
  'NEED_BUSINESS_DATA',
  'this subscriber type need business data',
  409,
);
