import { Type } from '@sinclair/typebox';

export const BinPropertySchema = Type.Object({
  id: Type.Number(),
  title: Type.String({ minLength: 1 }),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
