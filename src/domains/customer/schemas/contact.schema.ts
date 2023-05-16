import { Type } from '@sinclair/typebox';

export const ContactSchema = Type.Object({
  id: Type.Number(),
  name: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  surName: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  customer: Type.Number(),
  position: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
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
