import { createError } from '@fastify/error';

export const INVALID_PERMISSION = createError(
  'INVALID_PERMISSION',
  'we dont have this permission in system',
  400,
);
