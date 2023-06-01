import { expect, it } from '@jest/globals';
import { validateCustomerData } from '$src/domains/customer/utils';
import {
  NEED_BUSINESS_DATA,
  NOT_NEED_BUSINESS_DATA,
} from '$src/domains/customer/errors';

it('should error when business customer missing business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa', // empresa is a business
      businessName: null,
      businessDocumentType: null,
      businessFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa',
      businessName: 'TEST',
      businessDocumentType: null,
      businessFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa',
      businessName: 'TEST',
      businessDocumentType: 'cif',
      businessFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
});

it('should error when customer is not business and sending business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential', // residential is not business
      businessName: 'TEST',
      businessDocumentType: null,
      businessFiscalId: null,
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential',
      businessName: null,
      businessDocumentType: 'cif',
      businessFiscalId: null,
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential',
      businessName: null,
      businessDocumentType: null,
      businessFiscalId: '123',
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
});

it('should not error when business customer sending all business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa', // empresa is a business
      businessName: 'TEST',
      businessDocumentType: 'cif',
      businessFiscalId: '123',
    });
  }).not.toThrow(NEED_BUSINESS_DATA);
});

it('should not error when customer is not business and not sending business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential', // residential is not business
      businessName: null,
      businessDocumentType: null,
      businessFiscalId: null,
    });
  }).not.toThrow(NOT_NEED_BUSINESS_DATA);
});
