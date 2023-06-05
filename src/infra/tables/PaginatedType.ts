import { TAny, TProperties, TSchema, Type } from '@sinclair/typebox';
import assert from 'assert';

export const QueryString = <T extends TProperties>(props: T) =>
  Type.Object(props, {
    style: 'deepObject',
    explode: true,
  });

export const PaginatedQueryString = <
  T extends { orderBy?: TSchema; filter?: TSchema },
>(
  props: T,
) =>
  Type.Object(
    {
      page: Page(),
      pageSize: PageSize(),
      order: Order(),
      ...props,
    },
    {
      style: 'deepObject',
      explode: true,
    },
  );

export const Page = () => Type.Number({ default: 1 });
export const PageSize = () => Type.Number({ default: 10 });
export const Order = () =>
  Type.Unsafe<'asc' | 'desc'>(
    Type.String({
      enum: ['asc', 'desc'],
      default: 'desc',
    }),
  );

export const Filter = <T extends TProperties>(props: T) => {
  return Type.Optional(Type.Partial(Type.Object(props)));
};

export const OrderBy = (arr: string[]) =>
  Type.String({
    enum: arr,
    default: arr[0] ?? 'id',
  });

export const Searchable = () => Type.Object({ $like: Type.String() });

export const Range = <T extends TSchema>(props: T) =>
  Type.Object({
    $lte: Type.Optional(props),
    $gte: Type.Optional(props),
  });
