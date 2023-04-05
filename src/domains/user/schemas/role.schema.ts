import { Type, Static } from '@sinclair/typebox';
import removeItemsIn from '$src/infra/removeItemsIn';

export const RoleObject = {
    id: Type.Number(),
    title: Type.String({ minLength: 1 }),
    isActive: Type.Boolean(),
    creator: Type.Union([Type.Object({}), Type.Number()]),
    createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    deletedAt: Type.Optional(
        Type.Union([Type.Date(), Type.String({ format: "date-time" }), Type.Null()]),
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

export const InputRoleRemove: string[] = [
    'id',
    'creator',
    'createdAt',
    'updatedAt',
    'deletedAt',
];

export const InputRoleSchema = Type.Object(
    removeItemsIn(InputRoleRemove, RoleObject),
);
export type InputRoleType = Static<typeof InputRoleSchema>;
export const InputRoleExample: InputRoleType = removeItemsIn(
    InputRoleRemove,
    RoleExample,
);

export const OutputRoleRemove: string[] = ['deletedAt'];

export const OutputRoleSchema = Type.Object(
    removeItemsIn(OutputRoleRemove, RoleObject),
);
export type OutputRoleType = Static<typeof OutputRoleSchema>;
export const OutputRoleExample: OutputRoleType = removeItemsIn(
    OutputRoleRemove,
    RoleExample,
);
