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
      contactName: null,
      contactDocumentType: null,
      contactFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa',
      contactName: 'TEST',
      contactDocumentType: null,
      contactFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa',
      contactName: 'TEST',
      contactDocumentType: 'cif',
      contactFiscalId: null,
    });
  }).toThrow(NEED_BUSINESS_DATA);
});

it('should error when customer is not business and sending business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential', // residential is not business
      contactName: 'TEST',
      contactDocumentType: null,
      contactFiscalId: null,
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential',
      contactName: null,
      contactDocumentType: 'cif',
      contactFiscalId: null,
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential',
      contactName: null,
      contactDocumentType: null,
      contactFiscalId: '123',
    });
  }).toThrow(NOT_NEED_BUSINESS_DATA);
});

it('should not error when business customer sending all business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'empresa', // empresa is a business
      contactName: 'TEST',
      contactDocumentType: 'cif',
      contactFiscalId: '123',
    });
  }).not.toThrow(NEED_BUSINESS_DATA);
});

it('should not error when customer is not business and not sending business fields', () => {
  expect(() => {
    validateCustomerData({
      subscriberType: 'residential', // residential is not business
      contactName: null,
      contactDocumentType: null,
      contactFiscalId: null,
    });
  }).not.toThrow(NOT_NEED_BUSINESS_DATA);
});
