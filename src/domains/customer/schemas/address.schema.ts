import { Type } from '@sinclair/typebox';

export const AddressSchema = Type.Object({
  id: Type.Number(),
  customer: Type.Number(),
  province: Type.String(),
  city: Type.String(),
  street: Type.String(),
  postalCode: Type.String(),
  number: Type.Union([Type.Null(), Type.Number()]),
  building: Type.Union([Type.Null(), Type.String()]),
  stairway: Type.Union([Type.Null(), Type.String()]),
  floor: Type.Union([Type.Null(), Type.String()]),
  door: Type.Union([Type.Null(), Type.String()]),
  latitude: Type.Union([Type.Null(), Type.Number()]),
  longitude: Type.Union([Type.Null(), Type.Number()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
