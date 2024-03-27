import { Type } from '@sinclair/typebox';

export const EstimationSchema = Type.Object({
  id: Type.Integer(),
  totalProjectCost: Type.Integer(),
  costPerKey: Type.Integer(),
  costPerSqFt: Type.Integer(),
  kingStudioQuantity: Type.Optional(Type.Integer()),
  kingOneQuantity: Type.Optional(Type.Integer()),
  adaQuantity: Type.Optional(Type.Integer()),
  doubleQueenQuantity: Type.Optional(Type.Integer()),
  floors: Type.Optional(Type.Integer()),
  perimeter: Type.Optional(Type.Integer()),
  totalSqFt: Type.Optional(Type.Integer()),
  buildTime: Type.Integer(),
  zipCode: Type.String(),
  rooms: Type.Integer(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
});
