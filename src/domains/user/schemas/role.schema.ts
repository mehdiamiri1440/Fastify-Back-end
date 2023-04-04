import { Type, Static } from '@sinclair/typebox';

export const RoleSchema = Type.Object({
    title: Type.String(),
    isActive: Type.Boolean(),
});

export type RoleType = Static<typeof RoleSchema>;
