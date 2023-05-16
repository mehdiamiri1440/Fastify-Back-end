import { Type } from '@sinclair/typebox';

export const WarehouseStaffSchema = Type.Object({
  id: Type.Number(),
  warehouse: Type.Number(),
  user: Type.Number(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
