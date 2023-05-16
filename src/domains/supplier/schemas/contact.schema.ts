import { Type } from '@sinclair/typebox';

export const ContactSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  surName: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  supplier: Type.Number(),
  position: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  email: Type.Union([Type.String({ format: 'email' }), Type.Null()]),
  phoneNumber: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
