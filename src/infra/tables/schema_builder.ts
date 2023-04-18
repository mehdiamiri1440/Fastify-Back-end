import { Type } from '@sinclair/typebox';

export interface Options {
  orderable: string[];
  filterable: string[];
  searchable: string[];
}

export function ListQueryOptions(options: Options) {
  return Type.Object(
    {
      page: Type.Number({ default: 1 }),
      pageSize: Type.Number({ default: 10 }),
      order: Type.Optional(
        Type.String({
          enum: ['asc', 'desc'],
        }),
      ),
      orderBy: Type.Optional(
        Type.String({
          enum: options.orderable,
        }),
      ),
      filter: Type.Optional(
        Type.Object(
          Object.fromEntries(
            options.filterable.map((x) => [
              x,
              Type.Union([
                Type.String(),
                Type.Object({
                  like: Type.String(),
                }),
              ]),
            ]),
          ),
        ),
      ),
    },
    {
      style: 'deepObject',
      explode: true,
    },
  );
}
