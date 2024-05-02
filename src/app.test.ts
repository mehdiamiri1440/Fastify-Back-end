// Simple Jest Test
import 'reflect-metadata';
import { afterAll, beforeAll, expect, it, describe, test } from '@jest/globals';

test('adds 1 + 2 to equal 3', () => {
  // Arrange
  const a = 1;
  const b = 2;

  // Act
  const result = a + b;

  // Assert
  expect(result).toBe(3);
});
