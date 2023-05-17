import { nifRegex } from '$src/domains/user/schemas/user.schema';
import { expect, it } from '@jest/globals';

it('should expect nif', async () => {
  expect(nifRegex.test('X.0000001H')).toBe(false);
  expect(nifRegex.test('ESX9999999X')).toBe(true);
});
