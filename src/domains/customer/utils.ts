import { isBusiness } from './statics/subscriberTypes';
import { Static, Type } from '@sinclair/typebox';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import {
  NEED_BUSINESS_DATA,
  NOT_NEED_BUSINESS_DATA,
} from '$src/domains/customer/errors';

const businessData = [
  'businessName',
  'businessFiscalId',
  'businessDocumentType',
] as const;

const neededDataOfCustomer = Type.Pick(CustomerSchema, [
  ...businessData,
  'subscriberType',
]);

export function validateCustomerData(
  customer: Static<typeof neededDataOfCustomer>,
) {
  for (const field of businessData) {
    if (isBusiness(customer.subscriberType)) {
      if (customer[field] === null) throw new NEED_BUSINESS_DATA();
    } else {
      if (customer[field] !== null) throw new NOT_NEED_BUSINESS_DATA();
    }
  }
}
