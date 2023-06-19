import { Type } from '@sinclair/typebox';
import { AddressSchema } from '$src/domains/geo/address.schema';

export const WarehouseSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  description: Type.Union([Type.Null(), Type.String()]),
  supervisor: Type.Integer(),
  creator: Type.Integer(),
  address: Type.Omit(AddressSchema, ['formatted']),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
