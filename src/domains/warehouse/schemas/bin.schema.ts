import { Type } from '@sinclair/typebox';

export const BinSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  warehouse: Type.Integer(),
  size: Type.Integer(),
  property: Type.Integer(),
  physicalCode: Type.Union([Type.Null(), Type.String()]),
  internalCode: Type.String(),
  description: Type.Union([Type.Null(), Type.String()]),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
