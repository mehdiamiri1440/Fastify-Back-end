import { Type } from '@sinclair/typebox';
import StringEnum from '$src/infra/StringEnum';
import { allSubscriberTypes } from '$src/domains/customer/statics/subscriberTypes';
import { allDocumentTypes } from '$src/domains/customer/statics/documentTypes';

export const subscriberType = StringEnum([...allSubscriberTypes]);
export const documentType = StringEnum([...allDocumentTypes]);

export const CustomerSchema = Type.Object({
  id: Type.Number(),
  name: Type.String({ minLength: 1 }),
  businessName: Type.Union([Type.Null(), Type.String({ minLength: 1 })]),
  subscriberType,
  documentType,
  businessDocumentType: Type.Union([Type.Null(), documentType]),
  fiscalId: Type.String(),
  businessFiscalId: Type.Union([Type.Null(), Type.String()]),
  contactFamily1: Type.String(),
  contactFamily2: Type.Union([Type.Null(), Type.String()]),
  nationalityId: Type.Number(),
  birthday: Type.String({ format: 'date-time' }),
  isActive: Type.Boolean(),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Null(),
    Type.Date(),
    Type.String({ format: 'date-time' }),
  ]),
});
