import { Type, Static } from '@sinclair/typebox';

export const nifRegex = /^(?![0-9]{2})[a-zA-Z0-9]*[a-zA-Z0-9]$/gm;

export const UserSchema = Type.Object({
  id: Type.Integer(),
  firstName: Type.String({ minLength: 1 }),
  lastName: Type.String({ minLength: 1 }),
  role: Type.Integer(),
  email: Type.String({ format: 'email' }),
  phoneNumber: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  password: Type.String(),
  isActive: Type.Boolean(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
});
