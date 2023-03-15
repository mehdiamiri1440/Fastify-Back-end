import { FastifyRequest } from 'fastify';
import { Repository } from 'typeorm';
import * as where from '$src/infra/tables/filter';
import * as order from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';

export class TableQueryBuilder {
  #repo: Repository<any>;
  #req: FastifyRequest;

  #whereBuilder: (req: FastifyRequest) => any = (req) => where.from(req);
  #relationBuilder: (req: FastifyRequest) => any = (req) => undefined;
  #orderBuilder: (req: FastifyRequest) => any = (req) => order.from(req);

  constructor(repo: Repository<any>, req: FastifyRequest) {
    this.#repo = repo;
    this.#req = req;
  }

  where(builder: (req: FastifyRequest) => any) {
    this.#whereBuilder = builder;
    return this;
  }

  relation(builder: (req: FastifyRequest) => any) {
    this.#relationBuilder = builder;
    return this;
  }

  order(builder: (req: FastifyRequest) => any) {
    this.#orderBuilder = builder;
    return this;
  }

  async exec() {
    const req = this.#req;
    const { page, pageSize } = req.query as { page: number; pageSize: number };

    const [rows, total] = await this.#repo.findAndCount({
      where: this.#whereBuilder(req),
      order: this.#orderBuilder(req),
      relations: this.#relationBuilder(req),
      skip: (page - 1) * pageSize,
      take: pageSize,
      loadRelationIds: true,
    });

    return new PaginatedResponse(rows, {
      page: page,
      pageSize: pageSize,
      total,
    });
  }
}
