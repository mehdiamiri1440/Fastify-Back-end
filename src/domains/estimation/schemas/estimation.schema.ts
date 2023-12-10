import { Type } from '@sinclair/typebox';

export const EstimationSchema = Type.Object({
  id: Type.Integer(),
  totalProjectCost: Type.Integer(),
  costPerKey: Type.Integer(),
  costPerSqFt: Type.Integer(),
  buildTime: Type.Integer(),
  zipCode: Type.Integer(),
  rooms: Type.Integer(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
});
