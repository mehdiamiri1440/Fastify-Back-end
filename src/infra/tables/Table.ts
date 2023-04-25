import * as where from '$src/infra/tables/filter';
import * as order from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { FastifyRequest } from 'fastify';
import { FindOneOptions, Repository } from 'typeorm';

export type WhereBuilder = (req: FastifyRequest) => FindOneOptions['where'];
export type RelationBuilder = (
  req: FastifyRequest,
) => FindOneOptions['relations'];
export type OrderBuilder = (req: FastifyRequest) => FindOneOptions['order'];
export type SelectBuilder = (req: FastifyRequest) => FindOneOptions['select'];

export class TableQueryBuilder {
  #repo: Repository<any>;
  #req: FastifyRequest;

  #whereBuilder: WhereBuilder = (req) => where.from(req);
  #relationBuilder: RelationBuilder = () => undefined;
  #orderBuilder: OrderBuilder = (req) => order.from(req);
  #selectBuilder: SelectBuilder = () => undefined;
  #loadRelationIds: FindOneOptions['loadRelationIds'] = true;

  constructor(repo: Repository<any>, req: FastifyRequest) {
    this.#repo = repo;
    this.#req = req;
  }

  where(builder: WhereBuilder) {
    this.#whereBuilder = builder;
    return this;
  }

  relation(builder: RelationBuilder) {
    this.#relationBuilder = builder;
    return this;
  }

  order(builder: OrderBuilder) {
    this.#orderBuilder = builder;
    return this;
  }

  loadRelationIds(value: FindOneOptions['loadRelationIds']) {
    this.#loadRelationIds = value;
    return this;
  }

  select(builder: SelectBuilder) {
    this.#selectBuilder = builder;
    return this;
  }

  async exec() {
    const req = this.#req;
    const { page, pageSize } = req.query as { page: number; pageSize: number };

    const [rows, total] = await this.#repo.findAndCount({
      select: this.#selectBuilder(req),
      where: this.#whereBuilder(req),
      order: this.#orderBuilder(req),
      relations: this.#relationBuilder(req),
      skip: (page - 1) * pageSize,
      take: pageSize,
      loadRelationIds: this.#loadRelationIds,
    });

    return new PaginatedResponse(rows, {
      page: page,
      pageSize: pageSize,
      total,
    });
  }
}
