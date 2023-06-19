import { Type } from '@sinclair/typebox';

export const WarehouseStaffSchema = Type.Object({
  id: Type.Integer(),
  warehouse: Type.Integer(),
  user: Type.Integer(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
