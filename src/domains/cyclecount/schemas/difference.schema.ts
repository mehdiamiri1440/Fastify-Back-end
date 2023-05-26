import { Type } from '@sinclair/typebox';

export const CycleCountDifferenceSchema = Type.Object({
  id: Type.Number(),
  cycleCount: Type.Number(),
  binProduct: Type.Number(),
  quantity: Type.Union([Type.Number(), Type.Null()]),
  difference: Type.Number(),
  counter: Type.Union([Type.Number(), Type.Null()]),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
