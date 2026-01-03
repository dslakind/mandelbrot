/**
 * Unit tests for mandelbrot computation
 */

import { describe, it, expect } from 'vitest';
import { escapeIterations, smoothEscape } from '../src/core/mandelbrot';

describe('Mandelbrot Computation', () => {
  describe('escapeIterations', () => {
    it('should return maxIterations for point inside set (origin)', () => {
      const result = escapeIterations(0, 0, 100);
      expect(result).toBe(100);
    });

    it('should return maxIterations for point inside set (-1, 0)', () => {
      const result = escapeIterations(-1, 0, 100);
      expect(result).toBe(100);
    });

    it('should escape quickly for (1, 0)', () => {
      const result = escapeIterations(1, 0, 100);
      expect(result).toBeLessThan(10);
    });

    it('should escape very quickly for (2, 2)', () => {
      const result = escapeIterations(2, 2, 100);
      expect(result).toBeLessThan(3);
    });

    it('should respect maxIterations limit', () => {
      const result = escapeIterations(0, 0, 50);
      expect(result).toBeLessThanOrEqual(50);
    });
  });

  describe('smoothEscape', () => {
    it('should return maxIterations for inside point', () => {
      const result = smoothEscape(0, 0, 100);
      expect(result).toBe(100);
    });

    it('should return smooth value less than maxIterations for escape point', () => {
      const result = smoothEscape(1, 0, 100);
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return normalized value', () => {
      const result = smoothEscape(2, 2, 100);
      expect(result).toBeLessThanOrEqual(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should have smooth variation', () => {
      const r1 = smoothEscape(0.5, 0, 100);
      const r2 = smoothEscape(0.51, 0, 100);
      // Values should be close for nearby points
      expect(Math.abs(r1 - r2)).toBeLessThan(5);
    });
  });
});
