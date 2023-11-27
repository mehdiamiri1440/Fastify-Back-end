import { Type } from '@sinclair/typebox';

export const LocationSchema = Type.Object({
  id: Type.Integer(),
  zipCode: Type.Integer(),
  city: Type.String(),
  state: Type.String(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
});
