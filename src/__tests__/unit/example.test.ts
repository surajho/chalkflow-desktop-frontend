import { describe, it, expect } from 'vitest';

// Example utility function to test
function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

describe('Unit Test Example: calculateProgress', () => {
  it('should return 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should return 50 when halfway complete', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it('should return 100 when complete', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it('should round to nearest integer', () => {
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(2, 3)).toBe(67);
  });
});
