import { Type } from '@sinclair/typebox';

export const BankSchema = Type.Object({
  id: Type.Integer(),
  customer: Type.Integer(),
  iban: Type.String(),
  bic: Type.String(),
  bankName: Type.String(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
