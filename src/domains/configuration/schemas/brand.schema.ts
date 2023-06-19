import { Type } from '@sinclair/typebox';

export const BrandSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  logoFileId: Type.Union([Type.Null(), Type.String()]),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
