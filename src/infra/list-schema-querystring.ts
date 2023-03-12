import { Type } from "@sinclair/typebox";

export interface Options {
  orderable: string[];
  filterable: string[];
  searchable: string[];
}

export function ListQueryOptions<T>(options: Options) {
  const fields = {
    page: Type.Optional(Type.Number({ default: 1 })),
    pageSize: Type.Optional(Type.Number({ default: 10 })),
    order: Type.Optional(
      Type.String({
        enum: ["asc", "desc"],
      })
    ),
    orderBy: Type.Optional(
      Type.String({
        enum: options.orderable,
      })
    ),
    ...Object.fromEntries(
      options.filterable.map((x) => [
        `filter.${x}`,
        Type.Optional(Type.String()),
      ])
    ),
    ...Object.fromEntries(
      options.searchable.map((x) => [
        `filter.${x}.like`,
        Type.Optional(Type.String()),
      ])
    ),
  };

  return fields;
}
