import { Type } from '@sinclair/typebox';

export const BankSchema = Type.Object({
  id: Type.Number(),
  customer: Type.Number(),
  iban: Type.String(),
  bic: Type.String(),
  bankName: Type.String(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
