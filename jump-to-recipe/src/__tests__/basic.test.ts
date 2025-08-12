import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Basic Test Suite', () => {
  it('should run basic assertions', () => {
    assert.strictEqual(2 + 2, 4);
    assert.strictEqual('hello'.length, 5);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    assert.strictEqual(arr.length, 3);
    assert.deepStrictEqual(arr, [1, 2, 3]);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    assert.strictEqual(obj.name, 'test');
    assert.strictEqual(obj.value, 42);
  });
});