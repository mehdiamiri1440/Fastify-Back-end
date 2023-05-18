import { Type } from '@sinclair/typebox';

export const BinSizeSchema = Type.Object({
  id: Type.Number(),
  title: Type.String({ minLength: 1 }),
  width: Type.Number(),
  height: Type.Number(),
  depth: Type.Number(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
