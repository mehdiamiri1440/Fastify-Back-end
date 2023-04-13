import { Type, Static } from '@sinclair/typebox';
import { omit } from 'lodash';

export const RoleObject = {
  id: Type.Number(),
  title: Type.String({ minLength: 1 }),
  isActive: Type.Boolean(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Optional(
    Type.Union([
      Type.Date(),
      Type.String({ format: 'date-time' }),
      Type.Null(),
    ]),
  ),
};
export const RoleSchema = Type.Object(RoleObject);

export type RoleType = Static<typeof RoleSchema>;

export const RoleExample: RoleType = {
  id: 1,
  title: 'Admin',
  isActive: true,
  creator: 1,
  createdAt: '2000-05-05 02-03-04',
  updatedAt: '2000-05-05 02-03-04',
  deletedAt: null,
};

const InputRoleRemove = [
  'id',
  'creator',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

export const InputRoleSchema = Type.Object(omit(RoleObject, InputRoleRemove));
export type InputRoleType = Static<typeof InputRoleSchema>;
export const InputRoleExample = omit(RoleExample, InputRoleRemove);
Object.seal(InputRoleExample);

export const OutputRoleRemove = ['deletedAt'] as const;

export const OutputRoleSchema = Type.Object(omit(RoleObject, OutputRoleRemove));
export type OutputRoleType = Static<typeof OutputRoleSchema>;
export const OutputRoleExample: OutputRoleType = omit(
  RoleExample,
  OutputRoleRemove,
);
Object.seal(OutputRoleExample);

const ModelRoleRemove = ['creator'] as const;

export const ModelRoleSchema = Type.Object(omit(RoleObject, ModelRoleRemove));
export type ModelRoleType = Static<typeof ModelRoleSchema>;
