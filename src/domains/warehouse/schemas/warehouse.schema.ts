import { Type } from '@sinclair/typebox';

export const WarehouseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  province: Type.String(),
  city: Type.String(),
  street: Type.String(),
  postalCode: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
