import { Type } from '@sinclair/typebox';

export const notificationSchema = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  detail: Type.String(),
  tag: Type.String(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
