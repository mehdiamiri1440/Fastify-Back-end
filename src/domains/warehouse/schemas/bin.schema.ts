import { Type } from '@sinclair/typebox';

export const BinSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  warehouse: Type.Number(),
  size: Type.Number(),
  property: Type.Number(),
  physicalCode: Type.Union([Type.Null(), Type.String()]),
  internalCode: Type.String(),
  description: Type.Union([Type.Null(), Type.String()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
