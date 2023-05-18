import { Type } from '@sinclair/typebox';

export const CategorySchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  parentId: Type.Union([Type.Null(), Type.Integer()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
