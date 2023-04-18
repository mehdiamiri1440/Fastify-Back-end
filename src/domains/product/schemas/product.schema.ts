import { Type } from '@sinclair/typebox';

export const ProductSchema = {
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  basicQuantity: Type.Number(),
  quantity: Type.Number(),
  barcode: Type.String(),
  invoiceSystemCode: Type.Number(),
  description: Type.String(),
  weight: Type.Number(),
  taxType: Type.Union([Type.Number(), Type.Object({})]),
  size: Type.Union([Type.Number(), Type.Object({})]),
  unit: Type.Union([Type.Number(), Type.Object({})]),
  brand: Type.Union([Type.Number(), Type.Object({})]),
  color: Type.Union([Type.Number(), Type.Object({})]),
  category: Type.Union([Type.Number(), Type.Object({})]),
  creatorId: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
};
