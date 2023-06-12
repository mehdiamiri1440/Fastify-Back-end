import { createError } from '@fastify/error';

export const SUPPLIER_SUPPLYING_OUR_PRODUCT = createError(
  'SUPPLIER_SUPPLYING_OUR_PRODUCT',
  'you cant delete supplier if supplier supplying any our product',
  400,
);
