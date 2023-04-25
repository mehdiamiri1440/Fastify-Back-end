import AppDataSource from '$src/DataSource';
import { PaginatedResponse } from '$src/infra/tables/response';
import { FastifyRequest } from 'fastify';
import { SelectQueryBuilder } from 'typeorm';

export type Target = (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>;

export class RawQueryTable {
  #builder: Target;
  #req: FastifyRequest;

  constructor(builder: Target, req: FastifyRequest) {
    this.#builder = builder;
    this.#req = req;
  }

  async exec() {
    const req = this.#req;
    const { page, pageSize, filter } = req.query as {
      page: number;
      pageSize: number;
      filter: Record<string, any>;
    };

    const sql = AppDataSource.createQueryBuilder().from(this.#builder, 'query');

    for (const [_key, value] of Object.entries(filter ?? {})) {
      const key = `"${_key}"`;

      if (value?.like) {
        sql.where(`${key} like :${_key}`, { [_key]: value.like });
        continue;
      }

      sql.where(`${key} = :${_key}`, { [_key]: value });
    }

    const total = (await sql.clone().select('count(*)').getRawOne()) as {
      count: string;
    };

    const rows = await sql
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .getRawMany();

    return new PaginatedResponse(rows, {
      page: page,
      pageSize: pageSize,
      total: Number(total.count),
    });
  }
}
