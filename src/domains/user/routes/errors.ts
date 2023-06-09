import { createError } from '@fastify/error';

export const ACCESS_DENIED = createError(
  'ACCESS_DENIED',
  'you dont have access',
  403,
);
