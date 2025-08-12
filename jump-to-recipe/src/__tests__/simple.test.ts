import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Simple Test', () => {
  it('should pass basic assertion', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should handle string operations', () => {
    assert.strictEqual('hello'.toUpperCase(), 'HELLO');
  });
});