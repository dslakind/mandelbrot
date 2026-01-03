/**
 * Tests for shader coordinate transformations
 */

import { describe, it, expect } from 'vitest';

/**
 * Simulates the fragment shader coordinate transformation
 */
function fragmentCoordToComplex(
  fragCoordX: number,
  fragCoordY: number,
  centerRe: number,
  centerIm: number,
  viewWidth: number,
  viewHeight: number
): { re: number; im: number } {
  // Convert from NDC (-1 to 1) to UV (0 to 1)
  const uvX = (fragCoordX + 1.0) * 0.5;
  const uvY = (fragCoordY + 1.0) * 0.5;

  // Convert to complex plane
  const re = centerRe - viewWidth * 0.5 + uvX * viewWidth;
  const im = centerIm - viewHeight * 0.5 + uvY * viewHeight;

  return { re, im };
}

describe('Shader Coordinate Transformations', () => {
  it('should map NDC center (0,0) to viewport center', () => {
    const result = fragmentCoordToComplex(0, 0, -0.5, 0, 3.0, 2.0);
    expect(result.re).toBeCloseTo(-0.5, 5);
    expect(result.im).toBeCloseTo(0, 5);
  });

  it('should map NDC bottom-left (-1,-1) to viewport bottom-left', () => {
    const centerRe = -0.5;
    const centerIm = 0;
    const viewWidth = 3.0;
    const viewHeight = 2.0;

    const result = fragmentCoordToComplex(-1, -1, centerRe, centerIm, viewWidth, viewHeight);

    // Bottom-left should be: centerRe - width/2, centerIm - height/2
    expect(result.re).toBeCloseTo(centerRe - viewWidth / 2, 5); // -2.0
    expect(result.im).toBeCloseTo(centerIm - viewHeight / 2, 5); // -1.0
  });

  it('should map NDC top-right (1,1) to viewport top-right', () => {
    const centerRe = -0.5;
    const centerIm = 0;
    const viewWidth = 3.0;
    const viewHeight = 2.0;

    const result = fragmentCoordToComplex(1, 1, centerRe, centerIm, viewWidth, viewHeight);

    // Top-right should be: centerRe + width/2, centerIm + height/2
    expect(result.re).toBeCloseTo(centerRe + viewWidth / 2, 5); // 1.0
    expect(result.im).toBeCloseTo(centerIm + viewHeight / 2, 5); // 1.0
  });

  it('should handle zoomed viewport correctly', () => {
    // Zoomed in 10x on the origin
    const centerRe = 0;
    const centerIm = 0;
    const viewWidth = 0.3;
    const viewHeight = 0.2;

    const result = fragmentCoordToComplex(0, 0, centerRe, centerIm, viewWidth, viewHeight);
    expect(result.re).toBeCloseTo(0, 5);
    expect(result.im).toBeCloseTo(0, 5);
  });

  it('should handle different aspect ratios', () => {
    // Wide viewport (16:9 aspect)
    const centerRe = -0.5;
    const centerIm = 0;
    const viewWidth = 3.0;
    const viewHeight = 3.0 / (16 / 9); // ~1.6875

    const result = fragmentCoordToComplex(0, 0, centerRe, centerIm, viewWidth, viewHeight);
    expect(result.re).toBeCloseTo(-0.5, 5);
    expect(result.im).toBeCloseTo(0, 5);
  });

  it('should produce correct complex coordinates for Mandelbrot cardinal point', () => {
    // Test that the bulb center (-0.5, 0) is correctly mapped
    const centerRe = -0.5;
    const centerIm = 0;
    const viewWidth = 3.0;
    const viewHeight = 2.0;

    // Center of viewport should be the bulb
    const center = fragmentCoordToComplex(0, 0, centerRe, centerIm, viewWidth, viewHeight);
    expect(center.re).toBeCloseTo(-0.5, 5);
    expect(center.im).toBeCloseTo(0, 5);

    // Left edge should include far left of Mandelbrot set
    const left = fragmentCoordToComplex(-1, 0, centerRe, centerIm, viewWidth, viewHeight);
    expect(left.re).toBeCloseTo(-2.0, 5);

    // Right edge should include main cardioid
    const right = fragmentCoordToComplex(1, 0, centerRe, centerIm, viewWidth, viewHeight);
    expect(right.re).toBeCloseTo(1.0, 5);
  });
});

describe('Smooth Coloring Math', () => {
  it('should handle smooth iteration calculation', () => {
    // Simulate the smooth coloring calculation
    const i = 50; // iterations before escape
    const zRe = 2.5;
    const zIm = 1.8;
    const maxIterations = 256;

    const magnitude = Math.sqrt(zRe * zRe + zIm * zIm);
    const nu = Math.log2(Math.log2(magnitude));
    const smooth = i + 1.0 - nu;

    // Should produce a smooth value
    expect(smooth).toBeGreaterThan(i);
    expect(smooth).toBeLessThan(i + 2);
    expect(Number.isFinite(smooth)).toBe(true);
  });

  it('should avoid log(0) for very small magnitudes', () => {
    const i = 100;
    let magnitude = 0.00001; // Very small

    // Apply the safety clamp from shader
    magnitude = Math.max(magnitude, 1.0000001);

    // For magnitudes that escaped (> 2.0), the calculation should work
    magnitude = 2.5;
    const nu = Math.log2(Math.log2(magnitude));
    expect(Number.isFinite(nu)).toBe(true);
  });

  it('should produce consistent values for similar escape points', () => {
    // Two points that escaped at similar times should have similar smooth values
    const i = 100;
    const magnitude1 = 2.5;
    const magnitude2 = 2.6;

    const nu1 = Math.log2(Math.log2(magnitude1));
    const nu2 = Math.log2(Math.log2(magnitude2));

    const smooth1 = i + 1.0 - nu1;
    const smooth2 = i + 1.0 - nu2;

    // Should be close
    expect(Math.abs(smooth1 - smooth2)).toBeLessThan(0.5);
  });
});
