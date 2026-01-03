/**
 * Unit tests for viewport and mapping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createViewport,
  resetViewport,
  pixelToComplex,
  complexToPixel,
  zoomToRect,
  getViewportBounds,
  getZoomFactor,
} from '../src/core/viewport';

describe('Viewport Utilities', () => {
  describe('createViewport', () => {
    it('should create a viewport with correct properties', () => {
      const vp = createViewport(-0.5, 0, 3, 2);
      expect(vp.centerRe).toBe(-0.5);
      expect(vp.centerIm).toBe(0);
      expect(vp.width).toBe(3);
      expect(vp.height).toBe(2);
    });
  });

  describe('resetViewport', () => {
    it('should create default view', () => {
      const vp = resetViewport(16 / 9);
      expect(vp.centerRe).toBe(-0.5);
      expect(vp.centerIm).toBe(0);
      const aspect = 16 / 9;
      const expectedWidth = Math.max(3.0, 3.0 * aspect) * 1.05;
      const expectedHeight = expectedWidth / aspect;
      expect(vp.width).toBeCloseTo(expectedWidth, 3);
      expect(vp.height).toBeCloseTo(expectedHeight, 3);
    });

    it('should maintain aspect ratio', () => {
      const aspect = 4 / 3;
      const vp = resetViewport(aspect);
      expect(vp.width / vp.height).toBeCloseTo(aspect, 2);
    });

    it('should fully cover Mandelbrot with padding', () => {
      const aspect = 16 / 9;
      const vp = resetViewport(aspect);
      const bounds = getViewportBounds(vp);

      expect(bounds.left).toBeLessThanOrEqual(-2);
      expect(bounds.right).toBeGreaterThanOrEqual(1);
      expect(bounds.top).toBeGreaterThanOrEqual(1.5);
      expect(bounds.bottom).toBeLessThanOrEqual(-1.5);
    });
  });

  describe('pixelToComplex', () => {
    it('should map center pixel to center', () => {
      const vp = resetViewport(16 / 9);
      const result = pixelToComplex(vp, 400, 225, 800, 450);
      expect(result.re).toBeCloseTo(vp.centerRe, 1);
      expect(result.im).toBeCloseTo(vp.centerIm, 1);
    });

    it('should map corners correctly', () => {
      const vp = createViewport(0, 0, 2, 2);
      const bounds = getViewportBounds(vp);

      const topLeft = pixelToComplex(vp, 0, 0, 100, 100);
      expect(topLeft.re).toBeCloseTo(bounds.left, 1);
      expect(topLeft.im).toBeCloseTo(bounds.top, 1);

      const bottomRight = pixelToComplex(vp, 100, 100, 100, 100);
      expect(bottomRight.re).toBeCloseTo(bounds.right, 1);
      expect(bottomRight.im).toBeCloseTo(bounds.bottom, 1);
    });
  });

  describe('complexToPixel', () => {
    it('should be inverse of pixelToComplex', () => {
      const vp = resetViewport(16 / 9);
      const originalPixel = { x: 400, y: 225 };
      const canvasW = 800;
      const canvasH = 450;

      const complex = pixelToComplex(vp, originalPixel.x, originalPixel.y, canvasW, canvasH);
      const pixel = complexToPixel(vp, complex.re, complex.im, canvasW, canvasH);

      expect(pixel.x).toBeCloseTo(originalPixel.x, 1);
      expect(pixel.y).toBeCloseTo(originalPixel.y, 1);
    });
  });

  describe('zoomToRect', () => {
    it('should zoom to rectangular selection', () => {
      const vp = resetViewport(16 / 9);
      const rect = { x: 200, y: 100, width: 400, height: 225 };
      const canvasSize = { width: 800, height: 450 };

      const newVp = zoomToRect(vp, rect, canvasSize);

      // Should be zoomed in (smaller width)
      expect(newVp.width).toBeLessThan(vp.width);
      expect(newVp.height).toBeLessThan(vp.height);

      // Should maintain aspect ratio
      expect(newVp.width / newVp.height).toBeCloseTo(16 / 9, 1);
    });

    it('should preserve aspect ratio with non-square selection', () => {
      const vp = resetViewport(16 / 9);
      const rect = { x: 100, y: 100, width: 600, height: 250 };
      const canvasSize = { width: 800, height: 450 };

      const newVp = zoomToRect(vp, rect, canvasSize);

      expect(newVp.width / newVp.height).toBeCloseTo(16 / 9, 1);
    });

    it('should recenter on selection midpoint', () => {
      const vp = resetViewport(16 / 9);
      const rect = { x: 50, y: 75, width: 200, height: 112.5 };
      const canvasSize = { width: 800, height: 450 };

      const newVp = zoomToRect(vp, rect, canvasSize);
      const centerPixelX = rect.x + rect.width / 2;
      const centerPixelY = rect.y + rect.height / 2;
      const centerComplex = pixelToComplex(vp, centerPixelX, centerPixelY, canvasSize.width, canvasSize.height);

      expect(newVp.centerRe).toBeCloseTo(centerComplex.re, 6);
      expect(newVp.centerIm).toBeCloseTo(centerComplex.im, 6);
    });
  });

  describe('getViewportBounds', () => {
    it('should return correct bounds', () => {
      const vp = createViewport(0, 0, 2, 2);
      const bounds = getViewportBounds(vp);

      expect(bounds.left).toBe(-1);
      expect(bounds.right).toBe(1);
      expect(bounds.top).toBe(1);
      expect(bounds.bottom).toBe(-1);
    });
  });

  describe('getZoomFactor', () => {
    it('should return ~1.0 for default view', () => {
      const vp = resetViewport(16 / 9);
      expect(getZoomFactor(vp)).toBeCloseTo(1.0, 2);
    });

    it('should return higher value for zoomed in view', () => {
      const vp1 = resetViewport(16 / 9);
      const vp2 = createViewport(-0.5, 0, vp1.width / 2, vp1.height / 2);

      expect(getZoomFactor(vp2)).toBeGreaterThan(getZoomFactor(vp1));
    });
  });
});
