/**
 * Core types for the Mandelbrot Explorer
 */

export interface Viewport {
  centerRe: number;
  centerIm: number;
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface ComplexPoint {
  re: number;
  im: number;
}

export type ColorMode = 'discrete' | 'smooth';

export interface RenderSettings {
  maxIterations: number;
  smoothColoring: boolean;
  gamma: number;
  insideColor: [number, number, number]; // RGB 0-1
  palette: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  progressiveRefinement: boolean;
  reduceQualityWhileDragging: boolean;
  debugMode?: 'none' | 'gradient' | 'grayscale';
  zoomFactor?: number; // click-to-zoom multiplier
}

export interface RenderStats {
  iterationCount: number;
  renderTime: number;
  frameTime: number;
}
