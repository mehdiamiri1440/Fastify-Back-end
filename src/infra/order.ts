import { FastifyRequest } from "fastify";

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
    [orderBy ?? "id"]: order ?? "desc",
  };
}
