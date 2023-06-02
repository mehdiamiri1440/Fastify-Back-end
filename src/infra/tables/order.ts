import { FastifyRequest } from 'fastify';
import { transform } from 'dottie';

export function toTypeOrmOrder(
  orderBy: string,
  order: 'asc' | 'desc' | 'ASC' | 'DESC',
) {
  return transform({ [orderBy]: order.toLowerCase() });
}

export function from(req: FastifyRequest) {
  const { query } = req;
  if (!query) {
    return;
  }

  const { order, orderBy } = query as any;
  if (!order || !orderBy) {
    return;
  }

  return toTypeOrmOrder(orderBy, order);
}

export const toUpperCase = (order: 'asc' | 'desc'): 'ASC' | 'DESC' =>
  order.toUpperCase() as 'ASC' | 'DESC';
