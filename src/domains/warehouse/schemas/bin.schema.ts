import { Type } from '@sinclair/typebox';

export const BinSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  warehouse: Type.Number(),
  size: Type.Number(),
  property: Type.Number(),
  physicalCode: Type.Union([Type.String(), Type.Null()]),
  internalCode: Type.String(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
