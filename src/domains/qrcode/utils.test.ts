import { describe, expect, it } from '@jest/globals';
import { inferCodeType, QrCodeType } from './utils';

describe('QrCode', () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  it('should infer product code correctly', () => {
    expect(inferCodeType(`PR${today}2345`)).toBe(QrCodeType.PRODUCT);
  });

  it('should infer inbound code correctly', () => {
    expect(inferCodeType(`IN${today}7890`)).toBe(QrCodeType.INBOUND);
  });

  it('should infer outbound code correctly', () => {
    expect(inferCodeType(`OT${today}8765`)).toBe(QrCodeType.OUTBOUND);
  });

  it('should infer customer code correctly', () => {
    expect(inferCodeType(`CU${today}5678`)).toBe(QrCodeType.CUSTOMER);
  });

  it('should throw error for unknown code type', () => {
    expect(() => inferCodeType(`XY${today}1234`)).toThrow(Error);
  });
});
