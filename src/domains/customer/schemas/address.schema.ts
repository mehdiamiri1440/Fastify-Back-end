import { Type } from '@sinclair/typebox';

export const AddressSchema = Type.Object({
  id: Type.Number(),
  customer: Type.Number(),
  province: Type.String(),
  city: Type.String(),
  street: Type.String(),
  postalCode: Type.String(),
  number: Type.Union([Type.Number(), Type.Null()]),
  building: Type.Union([Type.String(), Type.Null()]),
  stairway: Type.Union([Type.String(), Type.Null()]),
  floor: Type.Union([Type.String(), Type.Null()]),
  door: Type.Union([Type.String(), Type.Null()]),
  latitude: Type.Union([Type.Number(), Type.Null()]),
  longitude: Type.Union([Type.Number(), Type.Null()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
