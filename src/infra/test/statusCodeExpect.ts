// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from '@jest/globals';

expect.extend({
  // ...any other custom matchers.
  statusCodeToBe(actual, expected) {
    const pass = expected === actual.statusCode;
    return {
      pass,
      message: pass
        ? () => `ok`
        : () =>
            `expected status code :${expected}, actual:${actual.statusCode}.\n payload: ${actual.payload}`,
    };
  },
});

declare module 'expect' {
  interface Matchers<R extends void | Promise<void>, T = unknown> {
    statusCodeToBe(expectedStatusCode: number): R;
  }
}
