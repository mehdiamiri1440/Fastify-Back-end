import createError from '@fastify/error';
import { SubscriberType, isBusiness } from './statics/subscriberTypes';

const NOT_NEED_BUSINESS_DATA = createError(
  'NOT_NEED_BUSINESS_DATA',
  'this subscriber type not need business data',
  409,
);
const NEED_BUSINESS_DATA = createError(
  'NEED_BUSINESS_DATA',
  'this subscriber type need business data',
  409,
);

export function validateCustomerData({
  businessName,
  businessFiscalId,
  businessDocumentType,
  subscriberType,
}: {
  businessName: string | null;
  businessFiscalId: string | null;
  businessDocumentType: string | null;
  subscriberType: SubscriberType;
}) {
  const allBusinessData =
    businessName && businessFiscalId && businessDocumentType;
  const anyBusinessData =
    businessName || businessFiscalId || businessDocumentType;

  const needBusinessData = isBusiness(subscriberType);

  if (needBusinessData) {
    if (!allBusinessData) throw new NEED_BUSINESS_DATA();
  } else {
    if (anyBusinessData) throw new NOT_NEED_BUSINESS_DATA();
  }
}
