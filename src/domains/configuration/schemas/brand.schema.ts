import { Type } from '@sinclair/typebox';

export const BrandSchema = Type.Object({
    id: Type.Number(),
    name: Type.String({ minLength: 1 }),
    creator: Type.Union([Type.Object({}), Type.Number()]),
    createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
    deletedAt: Type.Union([
        Type.Date(),
        Type.String({ format: 'date-time' }),
        Type.Null(),
    ]),
});
