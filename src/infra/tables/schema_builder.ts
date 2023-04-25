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
    },
    orderBy: {
      type: 'string',
      enum: options.orderable,
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
