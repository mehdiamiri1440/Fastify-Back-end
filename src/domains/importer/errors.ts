import createError from '@fastify/error';

export const NOT_VALID = createError(
  'NOT_VALID',
  'this csv file is not valid',
  400,
);
