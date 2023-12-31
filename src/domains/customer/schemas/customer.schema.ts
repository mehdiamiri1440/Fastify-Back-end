import { Type } from '@sinclair/typebox';
import { allSubscriberTypes } from '$src/domains/customer/statics/subscriberTypes';
import { allDocumentTypes } from '$src/domains/customer/statics/documentTypes';
import { StringEnum } from '$src/infra/TypeboxTypes';

export const subscriberType = StringEnum([...allSubscriberTypes]);
export const documentType = StringEnum([...allDocumentTypes]);

export const CustomerSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String({ minLength: 1 }),
  contactName: Type.Union([Type.Null(), Type.String({ minLength: 1 })]),
  subscriberType,
  documentType,
  contactDocumentType: Type.Union([Type.Null(), documentType]),
  fiscalId: Type.String(),
  contactFiscalId: Type.Union([Type.Null(), Type.String()]),
  contactFamily1: Type.String(),
  contactFamily2: Type.Union([Type.Null(), Type.String()]),
  nationalityId: Type.Integer(),
  birthday: Type.Union([Type.Null(), Type.String({ format: 'date-time' })]),
  isActive: Type.Boolean(),
  creator: Type.Integer(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
