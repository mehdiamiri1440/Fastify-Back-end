import { Type } from '@sinclair/typebox';

export const ProductSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  barcode: Type.String(),
  code: Type.Optional(Type.String()),
  invoiceSystemCode: Type.Number(),
  description: Type.String(),
  weight: Type.Number(),
  content: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date' }),
    Type.Null(),
  ]),
});
