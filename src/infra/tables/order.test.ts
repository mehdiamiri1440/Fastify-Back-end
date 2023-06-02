import { expect, it } from '@jest/globals';
import { describe } from 'node:test';
import { toTypeOrmOrder } from './order';

describe('toTypeOrmOrder', () => {
  it('it should work with basic order', () => {
    expect(toTypeOrmOrder('id', 'asc')).toEqual({
      id: 'asc',
    });
    expect(toTypeOrmOrder('id', 'desc')).toEqual({
      id: 'desc',
    });
  });

  it('it should work with nested order', () => {
    expect(toTypeOrmOrder('creator.firstName', 'desc')).toEqual({
      creator: {
        firstName: 'desc',
      },
    });
  });
});
