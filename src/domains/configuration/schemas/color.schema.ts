import { Type } from '@sinclair/typebox';

export const ColorSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  code: Type.RegEx(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
