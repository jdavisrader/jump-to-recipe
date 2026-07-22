import { fractionToDecimal, parseQuantityInput } from '../fraction-utils';

describe('fractionToDecimal', () => {
  it('handles mixed numbers with uncommon denominators', () => {
    expect(fractionToDecimal('1 2/5')).toBeCloseTo(1.4);
  });

  it('handles mixed numbers with common denominators', () => {
    expect(fractionToDecimal('1 3/4')).toBeCloseTo(1.75);
  });
});

describe('parseQuantityInput', () => {
  it('parses whole numbers', () => {
    expect(parseQuantityInput('2')).toEqual({ amount: 2, displayAmount: '2' });
  });

  it('parses decimals', () => {
    expect(parseQuantityInput('1.5')).toEqual({ amount: 1.5, displayAmount: '1.5' });
  });

  it('parses simple fractions', () => {
    const result = parseQuantityInput('1/2');
    expect(result?.amount).toBeCloseTo(0.5);
    expect(result?.displayAmount).toBe('½');
  });

  it('parses mixed fractions with common denominators as unicode', () => {
    const result = parseQuantityInput('1 3/4');
    expect(result?.amount).toBeCloseTo(1.75);
    expect(result?.displayAmount).toBe('1¾');
  });

  it('parses mixed fractions with uncommon denominators', () => {
    const result = parseQuantityInput('1 2/5');
    expect(result?.amount).toBeCloseTo(1.4);
    expect(result?.displayAmount).toBe('1 2/5');
  });

  it('treats empty input as a valid zero quantity', () => {
    expect(parseQuantityInput('')).toEqual({ amount: 0, displayAmount: '' });
    expect(parseQuantityInput('   ')).toEqual({ amount: 0, displayAmount: '' });
  });

  it('rejects non-numeric garbage', () => {
    expect(parseQuantityInput('abc')).toBeNull();
  });

  it('rejects negative numbers', () => {
    expect(parseQuantityInput('-1')).toBeNull();
  });

  it('rejects a zero denominator', () => {
    expect(parseQuantityInput('1/0')).toBeNull();
  });
});
