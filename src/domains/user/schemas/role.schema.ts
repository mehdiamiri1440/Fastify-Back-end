import { Type } from '@sinclair/typebox';

export const RoleSchema = Type.Object({
  id: Type.Number(),
  title: Type.String({ minLength: 1 }),
  isActive: Type.Boolean(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Optional(
    Type.Union([
      Type.Null(),
      Type.Date(),
      Type.String({ format: 'date-time' }),
    ]),
  ),
});
