import { describe, expect, it } from '@jest/globals';
import { toTsQuery } from './tsquery';

describe('toTsQuery', () => {
  it('should replace non-alphanumeric characters and join with |', () => {
    expect(toTsQuery('Hello, world!')).toEqual('Hello | world');
  });

  it('should handle multiple spaces and trim spaces', () => {
    expect(toTsQuery('  Hello    world! ')).toEqual('Hello | world');
  });

  it('should handle empty strings', () => {
    expect(toTsQuery('')).toEqual('');
  });

  it('should handle strings with only non-alphanumeric characters', () => {
    expect(toTsQuery('?!.,;:-_')).toEqual('');
  });

  it('should handle strings with only spaces', () => {
    expect(toTsQuery('      ')).toEqual('');
  });

  it('should handle alphanumeric strings without spaces', () => {
    expect(toTsQuery('HelloWorld123')).toEqual('HelloWorld123');
  });
});
