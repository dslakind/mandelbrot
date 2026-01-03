/**
 * Unit tests for palette generation
 */

import { describe, it, expect } from 'vitest';
import { generatePalette, getPaletteNames, samplePalette, applyGamma } from '../src/core/palette';

describe('Palette Generation', () => {
  describe('getPaletteNames', () => {
    it('should return available palette names', () => {
      const names = getPaletteNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('classic');
      expect(names).toContain('viridis');
    });
  });

  describe('generatePalette', () => {
    it('should generate palette with correct size', () => {
      const palette = generatePalette('classic', 256);
      expect(palette.length).toBe(256 * 4); // RGBA
    });

    it('should generate palette with values in valid range', () => {
      const palette = generatePalette('classic', 256);
      for (let i = 0; i < palette.length; i++) {
        expect(palette[i]).toBeGreaterThanOrEqual(0);
        expect(palette[i]).toBeLessThanOrEqual(255);
      }
    });

    it('should default to classic palette for unknown name', () => {
      const palette = generatePalette('nonexistent', 256);
      expect(palette.length).toBe(256 * 4);
    });

    it('should generate different palettes', () => {
      const p1 = generatePalette('classic', 256);
      const p2 = generatePalette('viridis', 256);
      // Should have different values
      let different = false;
      for (let i = 0; i < Math.min(100, p1.length); i++) {
        if (p1[i] !== p2[i]) {
          different = true;
          break;
        }
      }
      expect(different).toBe(true);
    });
  });

  describe('applyGamma', () => {
    it('should apply gamma correction', () => {
      const palette = generatePalette('classic', 256);
      const corrected = applyGamma(palette, 2.2);
      
      expect(corrected.length).toBe(palette.length);
      // Values should change with gamma
      let changed = false;
      for (let i = 0; i < Math.min(100, palette.length); i += 4) {
        if (palette[i] !== corrected[i]) {
          changed = true;
          break;
        }
      }
      expect(changed).toBe(true);
    });

    it('should maintain gamma 1.0 as identity', () => {
      const palette = generatePalette('classic', 256);
      const corrected = applyGamma(palette, 1.0);
      
      for (let i = 0; i < palette.length; i++) {
        expect(corrected[i]).toBeCloseTo(palette[i], 1);
      }
    });
  });

  describe('samplePalette', () => {
    it('should sample palette at 0', () => {
      const palette = generatePalette('classic', 256);
      const color = samplePalette(palette, 0);
      expect(color.length).toBe(4);
      expect(color[3]).toBeCloseTo(1.0); // Alpha
    });

    it('should sample palette at 1', () => {
      const palette = generatePalette('classic', 256);
      const color = samplePalette(palette, 1);
      expect(color.length).toBe(4);
      expect(color[3]).toBeCloseTo(1.0);
    });

    it('should clamp out of range values', () => {
      const palette = generatePalette('classic', 256);
      const color1 = samplePalette(palette, -0.5);
      const color2 = samplePalette(palette, 0);
      
      // Should be clamped to 0
      expect(color1[0]).toBe(color2[0]);
      expect(color1[1]).toBe(color2[1]);
      expect(color1[2]).toBe(color2[2]);
    });

    it('should return values in [0, 1]', () => {
      const palette = generatePalette('classic', 256);
      const color = samplePalette(palette, 0.5);
      
      for (let i = 0; i < 4; i++) {
        expect(color[i]).toBeGreaterThanOrEqual(0);
        expect(color[i]).toBeLessThanOrEqual(1);
      }
    });

    it('should produce non-black colors across the ramp', () => {
      const palette = generatePalette('viridis', 256);
      const mid = samplePalette(palette, 0.25);
      const high = samplePalette(palette, 0.75);

      const sumMid = mid[0] + mid[1] + mid[2];
      const sumHigh = high[0] + high[1] + high[2];

      expect(sumMid).toBeGreaterThan(0.1);
      expect(sumHigh).toBeGreaterThan(0.1);
    });
  });
});
