import { TAny, TProperties, TSchema, Type } from '@sinclair/typebox';
import assert from 'assert';

export const QueryString = <T extends TProperties>(props: T) =>
  Type.Object(props, {
    style: 'deepObject',
    explode: true,
  });

export const PaginatedQueryString = <T extends TProperties>(props: T) =>
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

type FilterFieldOption = {
  filterable?: boolean;
  searchable?: boolean;
};

export const Searchable = () => Type.Object({ $like: Type.String() });

// export const FilterField = (
//   type: TSchema,
//   { filterable, searchable }: FilterFieldOption = {},
// ) => {
//   const allowed: TSchema[] = [];
//   if (filterable) allowed.push(type);
//   if (searchable) allowed.push(TSearchType);

//   assert(
//     allowed.length > 0,
//     'Field should be each of filterable or/and searchable',
//   );

//   return Type.Union(allowed);
// };

// export const NumberFilterField = ({
//   filterable,
//   searchable,
// }: FilterFieldOption = {}) => {
//   const allowed: TSchema[] = [];
//   if (filterable) allowed.push(Type.Number());
//   if (searchable) allowed.push(TSearchType);

//   assert(
//     allowed.length > 0,
//     'Field should be each of filterable or/and searchable',
//   );

//   return Type.Union(allowed);
// };

// export const StringFilterField = ({
//   filterable,
//   searchable,
// }: FilterFieldOption = {}) => {
//   const allowed: TSchema[] = [];
//   if (filterable) allowed.push(Type.String());
//   if (searchable) allowed.push(TSearchType);

//   assert(
//     allowed.length > 0,
//     'Field should be each of filterable or/and searchable',
//   );

//   return Type.Union(allowed as TAny[]);
// };

// export const BooleanFilterField = () => {
//   return Type.Boolean();
// };
