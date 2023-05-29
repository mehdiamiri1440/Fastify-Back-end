import { FastifyRequest } from 'fastify';

export function from(req: FastifyRequest) {
  const { query } = req;
  if (!query) {
    return;
  }

  const { order, orderBy } = query as any;
  if (!order) {
    return;
  }

  return {
    [orderBy ?? 'id']: order ?? 'desc',
  };
}

export const toUpperCase = (order: 'asc' | 'desc'): 'ASC' | 'DESC' =>
  order.toUpperCase() as 'ASC' | 'DESC';
