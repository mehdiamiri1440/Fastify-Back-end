import { Type } from '@sinclair/typebox';

export const ContactSchema = Type.Object({
  id: Type.Number(),

  customer: Type.Number(),
  position: Type.Union([Type.Null(), Type.String({ minLength: 1 })]),
  name: Type.Union([Type.Null(), Type.String({ minLength: 1 })]),
  surName: Type.Union([Type.Null(), Type.String({ minLength: 1 })]),
  email: Type.String({ format: 'email' }),
  phoneNumber: Type.String({ minLength: 1 }),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
