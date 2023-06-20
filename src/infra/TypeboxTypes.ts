import { TSchema, Type } from '@sinclair/typebox';

export const Nullable = <T extends TSchema>(schema: T) =>
  Type.Union([Type.Null(), schema], { default: null });

export const Price = () => Type.RegEx(/^-?(([1-9]\d{0,15})|0)(\.\d{1,2})?$/);

export const Quantity = () => Type.Integer({ minimum: 1 });

export function StringEnum<T extends string[]>(values: [...T]) {
  return Type.Unsafe<T[number]>({ type: 'string', enum: values });
}
