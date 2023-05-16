import { Type, Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  id: Type.Number(),
  firstName: Type.String({ minLength: 1 }),
  lastName: Type.String({ minLength: 1 }),
  role: Type.Number(),
  nif: Type.RegEx(/^(?![0-9]{2})[a-zA-Z0-9]*[a-zA-Z0-9]$/),
  email: Type.String({ format: 'email' }),
  phoneNumber: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  password: Type.String(),
  position: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  isActive: Type.Boolean(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date' })]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
});
