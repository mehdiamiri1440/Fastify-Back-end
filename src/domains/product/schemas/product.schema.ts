import { Category } from '$src/domains/configuration/models/Category';
import { Type } from '@sinclair/typebox';

export const ProductSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  barcode: Type.String(),
  code: Type.Optional(Type.String()),
  invoiceSystemCode: Type.Number(),
  description: Type.String(),
  weight: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date' }),
    Type.Null(),
  ]),
});
