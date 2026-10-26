/**
 * @jest-environment node
 */

jest.mock('../env', () => ({ env: {} }));

import { env } from '../env';
import { isValidSignupCode } from '../signup-code';

const mockEnv = env as { SIGNUP_CODE?: string };

describe('isValidSignupCode', () => {
  afterEach(() => {
    delete mockEnv.SIGNUP_CODE;
  });

  it('accepts the configured code', () => {
    mockEnv.SIGNUP_CODE = 'tasty-tomato-42';
    expect(isValidSignupCode('tasty-tomato-42')).toBe(true);
  });

  it('ignores surrounding whitespace', () => {
    mockEnv.SIGNUP_CODE = 'tasty-tomato-42';
    expect(isValidSignupCode('  tasty-tomato-42 ')).toBe(true);
  });

  it('rejects a wrong code', () => {
    mockEnv.SIGNUP_CODE = 'tasty-tomato-42';
    expect(isValidSignupCode('tasty-tomato-43')).toBe(false);
    expect(isValidSignupCode('TASTY-TOMATO-42')).toBe(false);
    expect(isValidSignupCode('')).toBe(false);
  });

  it('rejects everything when SIGNUP_CODE is unset', () => {
    expect(isValidSignupCode('anything')).toBe(false);
    expect(isValidSignupCode('')).toBe(false);
  });
});
