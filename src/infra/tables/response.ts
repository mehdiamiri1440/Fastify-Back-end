import { Response } from '../Response';

export class PaginatedResponse<T> extends Response {
  constructor(
    data: T,
    meta: { page: number; pageSize: number; total: number },
  ) {
    super(data, meta);
  }
}
