import * as where from '$src/infra/tables/filter';
import * as order from '$src/infra/tables/order';
import { PaginatedResponse } from '$src/infra/tables/response';
import { FastifyRequest } from 'fastify';
import { FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

export type WhereBuilder<T> = (
  req: FastifyRequest,
) => FindOneOptions<T>['where'];
export type RelationBuilder<T> = (
  req: FastifyRequest,
) => FindOneOptions<T>['relations'];
export type OrderBuilder = (req: FastifyRequest) => FindOneOptions['order'];
export type SelectBuilder<T> = (
  req: FastifyRequest,
) => FindOneOptions<T>['select'];

export class TableQueryBuilder<T extends ObjectLiteral> {
  #repo: Repository<T>;
  #req: FastifyRequest;

  #whereBuilder: WhereBuilder<T> = (req) => where.from(req);
  #relationBuilder: RelationBuilder<T> = () => undefined;
  #orderBuilder: OrderBuilder = (req) => order.from(req);
  #selectBuilder: SelectBuilder<T> = () => undefined;
  #loadRelationIds: FindOneOptions['loadRelationIds'] = true;

  constructor(repo: Repository<T>, req: FastifyRequest) {
    this.#repo = repo;
    this.#req = req;
  }

  where(i: FindOneOptions<T>['where']) {
    this.#whereBuilder = () => i;
    return this;
  }

  relation(i: FindOneOptions<T>['relations']) {
    this.#relationBuilder = () => i;
    this.#loadRelationIds = false;
    return this;
  }

  order(i: FindOneOptions<T>['order']) {
    this.#orderBuilder = () => i;
    return this;
  }

  loadRelationIds(i: FindOneOptions['loadRelationIds']) {
    this.#loadRelationIds = i;
    return this;
  }

  select(i: FindOneOptions<T>['select']) {
    this.#selectBuilder = () => i;
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
