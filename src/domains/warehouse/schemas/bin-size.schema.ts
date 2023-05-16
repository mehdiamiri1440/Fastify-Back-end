import { Type } from '@sinclair/typebox';

export const BinSizeSchema = Type.Object({
  id: Type.Number(),
  title: Type.String({ minLength: 1 }),
  width: Type.Union([Type.Null(), Type.String()]),
  length: Type.Union([Type.Null(), Type.String()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
