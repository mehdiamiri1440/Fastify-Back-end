import { Type } from '@sinclair/typebox';

export const MessageSchema = Type.Object({
  id: Type.Number(),
  subject: Type.String({ minLength: 1 }),
  message: Type.String({ minLength: 1 }),
  creator: Type.Union([Type.Object({}), Type.Number()]),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
