import { Type } from '@sinclair/typebox';

export const CycleCountDifferenceSchema = Type.Object({
  id: Type.Integer(),
  cycleCount: Type.Integer(),
  binProduct: Type.Integer(),
  quantity: Type.Union([Type.Integer(), Type.Null()]),
  difference: Type.Integer(),
  counter: Type.Union([Type.Integer(), Type.Null()]),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
