import createError from '@fastify/error';

export const INVALID_STATUS = createError('INVALID_STATUS', '%s', 400);
