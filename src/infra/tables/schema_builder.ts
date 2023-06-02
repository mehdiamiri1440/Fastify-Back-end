import { ObjectLiteral } from 'typeorm';

export interface Options {
  orderable: string[];
  filterable: string[];
  searchable: string[];
}

export type FilterValue = string | { $like: string };

export interface ListQueryParams<T = any> {
  page: number;
  pageSize: number;
  order?: 'asc' | 'desc';
  orderBy?: string;
  filter: T;
}

/**
 * @deprecated Use PaginatedType.ts
 */
export function ListQueryOptions(options: Options) {
  return {
    page: {
      type: 'number',
      default: 1,
    },
    pageSize: {
      type: 'number',
      default: 10,
    },
    order: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
    },
    orderBy: {
      type: 'string',
      enum: options.orderable.length ? options.orderable : ['id'],
      default: options.orderable[0] ?? 'id',
    },
    ...Object.fromEntries(
      options.filterable.map((key) => [`filter.${key}`, { type: 'string' }]),
    ),
    ...Object.fromEntries(
      options.searchable.map((key) => [
        `filter.${key}.$like`,
        { type: 'string' },
      ]),
    ),
  };
}
