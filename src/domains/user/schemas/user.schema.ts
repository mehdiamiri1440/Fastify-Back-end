import { Type, Static } from '@sinclair/typebox';
import removeItemsIn from '$src/infra/removeItemsIn';

export const UserObject = {
  id: Type.Number(),
  firstName: Type.String({ minLength: 1 }),
  lastName: Type.String({ minLength: 1 }),
  role: Type.Object({ id: Type.Number() }),
  nif: Type.RegEx(
    /^(X(-|\.)?0?\d{7}(-|\.)?[A-Z]|[A-Z](-|\.)?\d{7}(-|\.)?[0-9A-Z]|\d{8}(-|\.)?[A-Z])$/,
  ),
  email: Type.String({ format: 'email' }),
  phoneNumber: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  password: Type.String(),
  position: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isActive: Type.Boolean(),
  createdAt: Type.Union([Type.Date({ format: 'date' }), Type.String()]),
  updatedAt: Type.Union([Type.Date({ format: 'date' }), Type.String()]),
  deletedAt: Type.Optional(
    Type.Union([Type.Date(), Type.String({ format: 'date' }), Type.Null()]),
  ),
};
export const UserSchema = Type.Object(UserObject);

export type UserType = Static<typeof UserSchema>;

export const UserExample: UserType = {
  id: 1,
  firstName: 'Daniel',
  lastName: 'Soheil',
  role: { id: 1 },
  nif: 'B-6116622G',
  email: 'daniel@sohe.ir',
  password: 'hackme',
  position: 'Developer',
  isActive: true,
  createdAt: '2000-05-05 02-03-04',
  updatedAt: '2000-05-05 02-03-04',
  deletedAt: null,
};

export const InputUserRemove: string[] = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

export const InputUserSchema = Type.Object(
  removeItemsIn(InputUserRemove, UserObject),
);
export type InputUserType = Static<typeof InputUserSchema>;
export const InputUserExample: InputUserType = removeItemsIn(
  InputUserRemove,
  UserExample,
);

export const OutputUserRemove: string[] = ['password', 'deletedAt'];

export const OutputUserSchema = Type.Object(
  removeItemsIn(OutputUserRemove, UserObject),
);
export type OutputUserType = Static<typeof OutputUserSchema>;
export const OutputUserExample: OutputUserType = removeItemsIn(
  OutputUserRemove,
  UserExample,
);
