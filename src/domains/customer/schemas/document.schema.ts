import { Type } from '@sinclair/typebox';

export const DocumentSchema = Type.Object({
  id: Type.Integer(),
  customer: Type.Integer(),
  fileId: Type.String({ minLength: 1 }),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
