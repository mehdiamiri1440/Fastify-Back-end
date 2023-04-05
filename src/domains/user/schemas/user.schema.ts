import { Type, Static } from '@sinclair/typebox';
import removeItemsIn from '$src/infra/removeItemsIn';

export const UserSchema = Type.Object({
  id: Type.Number(),
  firstName: Type.String(),
  lastName: Type.String(),
  role: Type.Object({ id: Type.Number() }),
  nif: Type.Number(),
  email: Type.String(),
  phoneNumber: Type.Optional(Type.String()),
  password: Type.String(),
  position: Type.Optional(Type.String()),
  isActive: Type.Boolean(),
  createdAt: Type.Union([Type.Date(), Type.String()]),
  updatedAt: Type.Union([Type.Date(), Type.String()]),
  deletedAt: Type.Union([Type.Date(), Type.String(), Type.Null()]),
});

export type UserType = Static<typeof UserSchema>;

export const UserExample: UserType = {
  id: 1,
  firstName: 'Daniel',
  lastName: 'Soheil',
  role: { id: 1 },
  nif: 252021,
  email: 'daniel@sohe.ir',
  password: 'hackme',
  position: 'Developer',
  isActive: true,
  createdAt: 'YYYY-MM-DD HH-mm-ss',
  updatedAt: 'YYYY-MM-DD HH-mm-ss',
  deletedAt: null,
};

export const InputUserRemove: string[] = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

export const InputUserSchema = removeItemsIn(InputUserRemove, UserSchema);
export type InputUserType = Static<typeof InputUserSchema>;
export const InputUserExample: InputUserType = removeItemsIn(
  InputUserRemove,
  UserExample,
);

export const OutputUserRemove: string[] = [
  'password',
  'deletedAt',
];

export const OutputUserSchema = removeItemsIn(OutputUserRemove, UserSchema);
export type OutputUserType = Static<typeof OutputUserSchema>;
export const OutputUserExample: OutputUserType = removeItemsIn(
  OutputUserRemove,
  UserExample,
);
