import createError from '@fastify/error';

export const BIN_HAVE_PRODUCT = createError(
  'BIN_HAVE_PRODUCT',
  'this bin have product, first move that products to another bin',
  400,
);
