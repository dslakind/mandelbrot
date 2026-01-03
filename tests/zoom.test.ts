/**
 * Tests for zoom interaction and rendering
 */

import { describe, it, expect } from 'vitest';
import { zoomToRect, pixelToComplex, getZoomFactor } from '../src/core/viewport';
import type { Viewport, Rect, CanvasSize } from '../src/core/types';

describe('Zoom Interaction Tests', () => {
  const defaultViewport: Viewport = {
    centerRe: -0.5,
    centerIm: 0,
    width: 5.6,      // matches resetViewport(16/9) with padding
    height: 3.15,    // 5.6 / (16/9)
  };

  const canvasSize: CanvasSize = {
    width: 800,
    height: 450, // 16:9 aspect
  };

  describe('Rectangle Selection', () => {
    it('should zoom to center selection correctly', () => {
      // Select center quarter of the screen
      const rect: Rect = {
        x: 200,
        y: 112.5,
        width: 400,
        height: 225,
      };

      const newViewport = zoomToRect(defaultViewport, rect, canvasSize);

      // Should be centered on same point
      expect(newViewport.centerRe).toBeCloseTo(-0.5, 5);
      expect(newViewport.centerIm).toBeCloseTo(0, 5);

      // Should be 2x zoom (half the width)
      expect(newViewport.width).toBeCloseTo(defaultViewport.width / 2, 5);
    });

    it('should zoom to off-center selection', () => {
      // Select top-right quadrant
      const rect: Rect = {
        x: 400,
        y: 0,
        width: 400,
        height: 225,
      };

      const newViewport = zoomToRect(defaultViewport, rect, canvasSize);

      // Should be centered on the right side
      expect(newViewport.centerRe).toBeGreaterThan(-0.5);
      expect(newViewport.centerIm).toBeGreaterThan(0);

      // Should be 2x zoom
      expect(newViewport.width).toBeCloseTo(defaultViewport.width / 2, 5);
    });

    it('should preserve aspect ratio', () => {
      // Any rectangle selection
      const rect: Rect = {
        x: 100,
        y: 100,
        width: 300,
        height: 200,
      };

      const newViewport = zoomToRect(defaultViewport, rect, canvasSize);
      const aspectRatio = newViewport.width / newViewport.height;
      const canvasAspect = canvasSize.width / canvasSize.height;

      // Aspect ratio should match canvas
      expect(aspectRatio).toBeCloseTo(canvasAspect, 3);
    });

    it('should handle small zoom selections', () => {
      // Very small selection (deep zoom)
      const rect: Rect = {
        x: 400,
        y: 225,
        width: 20,
        height: 11.25,
      };

      const newViewport = zoomToRect(defaultViewport, rect, canvasSize);

      // Should be very zoomed in (40x)
      expect(newViewport.width).toBeLessThan(0.2);
      expect(newViewport.width).toBeGreaterThan(0);
    });

    it('should handle edge selections', () => {
      // Selection at canvas edge
      const rect: Rect = {
        x: 0,
        y: 0,
        width: 200,
        height: 112.5,
      };

      const newViewport = zoomToRect(defaultViewport, rect, canvasSize);

      // Should be valid viewport
      expect(newViewport.width).toBeGreaterThan(0);
      expect(newViewport.height).toBeGreaterThan(0);
      expect(Number.isFinite(newViewport.centerRe)).toBe(true);
      expect(Number.isFinite(newViewport.centerIm)).toBe(true);
    });
  });

  describe('Zoom Level Calculation', () => {
    it('should calculate zoom level for default viewport', () => {
      const zoom = getZoomFactor(defaultViewport);
      expect(zoom).toBeCloseTo(1.0, 5);
    });

    it('should calculate zoom level for 2x zoom', () => {
      const zoomedViewport: Viewport = {
        ...defaultViewport,
        width: defaultViewport.width / 2,
        height: defaultViewport.height / 2,
      };

      const zoom = getZoomFactor(zoomedViewport);
      expect(zoom).toBeCloseTo(2.0, 3);
    });

    it('should calculate zoom level for deep zoom', () => {
      const deepZoomViewport: Viewport = {
        ...defaultViewport,
        width: 0.056,
        height: 0.0315,
      };

      const zoom = getZoomFactor(deepZoomViewport);
      expect(zoom).toBeCloseTo(100.0, 1);
    });

    it('should handle extreme zoom levels', () => {
      const extremeZoomViewport: Viewport = {
        ...defaultViewport,
        width: 0.000003,
        height: 0.0000016875,
      };

      const zoom = getZoomFactor(extremeZoomViewport);
      expect(zoom).toBeGreaterThan(100000);
      expect(Number.isFinite(zoom)).toBe(true);
    });
  });

  describe('Pixel to Complex Mapping During Zoom', () => {
    it('should maintain accurate mapping after zoom', () => {
      // Zoom to a specific region
      const rect: Rect = {
        x: 300,
        y: 150,
        width: 200,
        height: 112.5,
      };

      const zoomedViewport = zoomToRect(defaultViewport, rect, canvasSize);

      // Center pixel should map to viewport center
      const centerPixelX = canvasSize.width / 2;
      const centerPixelY = canvasSize.height / 2;

      const complex = pixelToComplex(
        zoomedViewport,
        centerPixelX,
        centerPixelY,
        canvasSize.width,
        canvasSize.height
      );

      expect(complex.re).toBeCloseTo(zoomedViewport.centerRe, 5);
      expect(complex.im).toBeCloseTo(zoomedViewport.centerIm, 5);
    });

    it('should handle corner pixels correctly after zoom', () => {
      const zoomedViewport: Viewport = {
        centerRe: 0,
        centerIm: 0,
        width: 1.0,
        height: 0.5625,
      };

      // Top-left corner
      const topLeft = pixelToComplex(zoomedViewport, 0, 0, canvasSize.width, canvasSize.height);
      expect(topLeft.re).toBeCloseTo(-0.5, 5);
      expect(topLeft.im).toBeCloseTo(0.28125, 5);

      // Bottom-right corner
      const bottomRight = pixelToComplex(
        zoomedViewport,
        canvasSize.width,
        canvasSize.height,
        canvasSize.width,
        canvasSize.height
      );
      expect(bottomRight.re).toBeCloseTo(0.5, 5);
      expect(bottomRight.im).toBeCloseTo(-0.28125, 5);
    });
  });

  describe('Sequential Zoom Operations', () => {
    it('should handle multiple zoom operations', () => {
      let viewport = defaultViewport;

      // First zoom
      const rect1: Rect = { x: 200, y: 112.5, width: 400, height: 225 };
      viewport = zoomToRect(viewport, rect1, canvasSize);
      const zoom1 = getZoomFactor(viewport);

      // Second zoom
      const rect2: Rect = { x: 200, y: 112.5, width: 400, height: 225 };
      viewport = zoomToRect(viewport, rect2, canvasSize);
      const zoom2 = getZoomFactor(viewport);

      // Should be approximately 4x zoom total
      expect(zoom2).toBeCloseTo(4.0, 1);
      expect(zoom2).toBeGreaterThan(zoom1);
    });

    it('should maintain precision through deep zoom sequence', () => {
      let viewport = defaultViewport;

      // Zoom 10 times
      for (let i = 0; i < 10; i++) {
        const rect: Rect = {
          x: 300,
          y: 175,
          width: 200,
          height: 100,
        };
        viewport = zoomToRect(viewport, rect, canvasSize);
      }

      // Should still have valid viewport
      expect(viewport.width).toBeGreaterThan(0);
      expect(viewport.height).toBeGreaterThan(0);
      expect(Number.isFinite(viewport.centerRe)).toBe(true);
      expect(Number.isFinite(viewport.centerIm)).toBe(true);

      // Should be significantly zoomed
      const finalZoom = getZoomFactor(viewport);
      expect(finalZoom).toBeGreaterThan(10);
    });
  });

  describe('Zoom with Different Canvas Sizes', () => {
    it('should handle square canvas', () => {
      const squareCanvas: CanvasSize = { width: 600, height: 600 };
      const squareViewport: Viewport = {
        centerRe: -0.5,
        centerIm: 0,
        width: 3.0,
        height: 3.0,
      };

      const rect: Rect = {
        x: 150,
        y: 150,
        width: 300,
        height: 300,
      };

      const newViewport = zoomToRect(squareViewport, rect, squareCanvas);

      // Aspect should remain 1:1
      expect(newViewport.width).toBeCloseTo(newViewport.height, 5);
    });

    it('should handle portrait orientation', () => {
      const portraitCanvas: CanvasSize = { width: 450, height: 800 };
      const portraitViewport: Viewport = {
        centerRe: -0.5,
        centerIm: 0,
        width: 1.6875,
        height: 3.0,
      };

      const rect: Rect = {
        x: 112.5,
        y: 200,
        width: 225,
        height: 400,
      };

      const newViewport = zoomToRect(portraitViewport, rect, portraitCanvas);

      // Aspect should match portrait
      const aspectRatio = newViewport.width / newViewport.height;
      const canvasAspect = portraitCanvas.width / portraitCanvas.height;
      expect(aspectRatio).toBeCloseTo(canvasAspect, 3);
    });
  });
});
