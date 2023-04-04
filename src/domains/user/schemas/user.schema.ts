import { Type, Static } from '@sinclair/typebox';

export const UserSchema = Type.Object({
  firstName: Type.String(),
  lastName: Type.String(),
  role: Type.Object({ id: Type.Number() }),
  nif: Type.Number(),
  email: Type.String(),
  phoneNumber: Type.Optional(Type.String()),
  password: Type.String(),
  position: Type.Optional(Type.String()),
  isActive: Type.Boolean(),
});

export type UserType = Static<typeof UserSchema>;
