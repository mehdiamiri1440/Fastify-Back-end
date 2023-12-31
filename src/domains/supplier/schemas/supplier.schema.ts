import { Type } from '@sinclair/typebox';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const SupplierSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  cif: Type.String({ minLength: 1 }),
  language: Type.Integer(),
  iban: Type.String({ minLength: 1 }),
  email: Type.RegEx(emailRegex),
  phoneNumber: Type.String({ minLength: 1 }),
  logoFileId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  accountNumber: Type.String({ minLength: 1 }),
  bic: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  bankName: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
