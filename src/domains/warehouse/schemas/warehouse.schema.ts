import { Type } from '@sinclair/typebox';

export const WarehouseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  provinceCode: Type.String({ default: 'S43' }),
  cityCode: Type.String({ default: 'S43.001' }),
  streetCode: Type.String({ default: 'S43.001.00104' }),
  streetName: Type.String({ default: 'Alicante  en  ur mas en pares' }),
  postalCode: Type.String(),
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
});
