import { Type } from '@sinclair/typebox';
import { AddressSchema } from '$src/domains/warehouse/schemas/address.schema';

export const WarehouseSchema = Type.Composite([
  AddressSchema,
  Type.Object({
    id: Type.Number(),
    name: Type.String({ minLength: 1 }),
    description: Type.Union([Type.Null(), Type.String()]),
    supervisor: Type.Number(),
    creator: Type.Number(),
    createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    deletedAt: Type.Union([
      Type.Null(),
      Type.Date(),
      Type.String({ format: 'date-time' }),
    ]),
  }),
]);
