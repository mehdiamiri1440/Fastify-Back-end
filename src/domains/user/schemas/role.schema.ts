import { Type, Static } from '@sinclair/typebox';

export const RoleSchema = Type.Object({
    title: Type.String(),
});

export type RoleType = Static<typeof RoleSchema>;
