/**
 * Viewport utilities for managing the complex plane view
 */

import type { Viewport, Rect, CanvasSize } from './types';

/**
 * Create a viewport centered on a specific point
 */
export function createViewport(
  centerRe: number,
  centerIm: number,
  width: number,
  height: number
): Viewport {
  return { centerRe, centerIm, width, height };
}

/**
 * Reset to default Mandelbrot view.
 * Ensures the visible window always fully contains the classic
 * Mandelbrot extent: real in [-2, 1], imaginary in [-1.5, 1.5],
 * with a small padding so the set is not clipped on wide/tall canvases.
 */
export function resetViewport(aspectRatio: number): Viewport {
  const targetSpan = 3.0; // covers [-1.5, 1.5] or [-2, 1] width 3
  const padding = 1.05;   // 5% padding around the full set

  // Choose the viewport width so that the shorter axis is never < targetSpan.
  // This guarantees the full set is visible even on very wide or tall canvases.
  const width = Math.max(targetSpan, targetSpan * aspectRatio) * padding;
  const height = width / aspectRatio;

  // Center at (-0.5, 0) to keep the main cardioid in view
  return createViewport(-0.5, 0, width, height);
}

/**
 * Zoom to a rectangular selection, preserving aspect ratio
 */
export function zoomToRect(
  viewport: Viewport,
  rect: Rect,
  canvasSize: CanvasSize
): Viewport {
  const aspectRatio = canvasSize.width / canvasSize.height;

  // Center of the selection in pixel coordinates
  const centerPixelX = rect.x + rect.width / 2;
  const centerPixelY = rect.y + rect.height / 2;

  // Convert to complex plane
  const centerComplex = pixelToComplex(viewport, centerPixelX, centerPixelY, canvasSize.width, canvasSize.height);

  // Calculate new viewport dimensions, preserving aspect ratio
  const pixelWidth = rect.width;
  const pixelHeight = rect.height;
  const pixelAspect = pixelWidth / pixelHeight;

  let newWidth: number;
  let newHeight: number;

  if (pixelAspect > aspectRatio) {
    // Selection is wider than aspect ratio
    newWidth = (pixelWidth / canvasSize.width) * viewport.width;
    newHeight = newWidth / aspectRatio;
  } else {
    // Selection is taller than aspect ratio
    newHeight = (pixelHeight / canvasSize.height) * viewport.height;
    newWidth = newHeight * aspectRatio;
  }

  return createViewport(centerComplex.re, centerComplex.im, newWidth, newHeight);
}

/**
 * Convert pixel coordinates to complex plane coordinates
 */
export function pixelToComplex(
  viewport: Viewport,
  pixelX: number,
  pixelY: number,
  canvasWidth: number,
  canvasHeight: number
): { re: number; im: number } {
  const normalizedX = pixelX / canvasWidth;
  const normalizedY = pixelY / canvasHeight;

  const re = viewport.centerRe - viewport.width / 2 + normalizedX * viewport.width;
  const im = viewport.centerIm + viewport.height / 2 - normalizedY * viewport.height;

  return { re, im };
}

/**
 * Convert complex plane coordinates to pixel coordinates
 */
export function complexToPixel(
  viewport: Viewport,
  re: number,
  im: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const normalizedX = (re - (viewport.centerRe - viewport.width / 2)) / viewport.width;
  const normalizedY = (viewport.centerIm + viewport.height / 2 - im) / viewport.height;

  const x = normalizedX * canvasWidth;
  const y = normalizedY * canvasHeight;

  return { x, y };
}

/**
 * Get the bounds of the viewport in the complex plane
 */
export function getViewportBounds(viewport: Viewport) {
  const left = viewport.centerRe - viewport.width / 2;
  const right = viewport.centerRe + viewport.width / 2;
  const top = viewport.centerIm + viewport.height / 2;
  const bottom = viewport.centerIm - viewport.height / 2;

  return { left, right, top, bottom };
}

/**
 * Get zoom factor relative to the default view
 */
export function getZoomFactor(viewport: Viewport): number {
  const baseSpan = 3.0 * 1.05; // match padding used in resetViewport
  const visibleSpan = Math.min(viewport.width, viewport.height);
  return baseSpan / visibleSpan;
}
