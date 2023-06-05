import { Type } from '@sinclair/typebox';

export default function StringEnum<T extends string[]>(values: [...T]) {
  return Type.Unsafe<T[number]>({ type: 'string', enum: values });
}
