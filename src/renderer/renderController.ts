/**
 * Render controller with progressive refinement and debouncing
 */

import type { Viewport, RenderSettings } from '../core/types';
import { WebGL2Renderer } from './webgl/renderer';

export class RenderController {
  private renderer: WebGL2Renderer;
  private renderRequestId: number | null = null;
  private debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private animationFrameId: number | null = null;
  private holdZoomFrameId: number | null = null;
  private holdLastViewport: Viewport | null = null;
  private lastViewport: Viewport | null = null;
  private lastSettings: RenderSettings | null = null;

  private readonly DEBOUNCE_DELAY = 200; // ms

  constructor(renderer: WebGL2Renderer) {
    this.renderer = renderer;
  }

  /**
   * Smoothly animate zoom toward a target point
   */
  animateZoom(
    viewport: Viewport,
    settings: RenderSettings,
    target: { re: number; im: number },
    aspectRatio: number,
    onComplete?: (finalViewport: Viewport) => void,
  ): void {
    // Cancel pending work
    this.cancel();

    const zoomFactor = settings.zoomFactor ?? 2;
    const durationMs = 450;
    const startTime = performance.now();

    const start = viewport;
    const targetWidth = start.width / zoomFactor;
    const targetHeight = targetWidth / aspectRatio;

    // Lower iterations during animation for responsiveness
    const progressiveIterations = RenderController.getProgressiveIterations(settings.quality, true);
    const animSettings: RenderSettings = {
      ...settings,
      maxIterations: progressiveIterations,
    };

    // Ensure palette is current
    this.renderer.updatePalette(settings.palette);

    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const e = easeInOutQuad(t);

      const centerRe = start.centerRe + (target.re - start.centerRe) * e;
      const centerIm = start.centerIm + (target.im - start.centerIm) * e;
      const width = start.width + (targetWidth - start.width) * e;
      const height = width / aspectRatio;

      const currentViewport: Viewport = { centerRe, centerIm, width, height };

      this.renderer.render(currentViewport, animSettings);

      if (t < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        // Final high-quality render
        this.renderer.render(currentViewport, settings);
        this.lastViewport = currentViewport;
        this.lastSettings = settings;
        this.animationFrameId = null;
        if (onComplete) {
          onComplete(currentViewport);
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  /**
   * Start continuous zoom toward a target point while pointer is held down.
   */
  startHoldZoom(
    viewport: Viewport,
    settings: RenderSettings,
    target: { re: number; im: number },
    aspectRatio: number
  ): void {
    this.cancel();

    const zoomRatePerSec = 1.6; // exponential rate
    const startTime = performance.now();
    const start = viewport;
    const progressiveIterations = RenderController.getProgressiveIterations(settings.quality, true);
    const animSettings: RenderSettings = {
      ...settings,
      maxIterations: progressiveIterations,
    };

    this.renderer.updatePalette(settings.palette);

    const step = (now: number) => {
      const elapsedSec = Math.max(0, (now - startTime) / 1000);
      const factor = Math.exp(-zoomRatePerSec * elapsedSec); // width shrinks over time

      const width = start.width * factor;
      const height = width / aspectRatio;
      const currentViewport: Viewport = {
        centerRe: target.re,
        centerIm: target.im,
        width,
        height,
      };

      this.holdLastViewport = currentViewport;
      this.renderer.render(currentViewport, animSettings);
      this.holdZoomFrameId = requestAnimationFrame(step);
    };

    this.holdZoomFrameId = requestAnimationFrame(step);
  }

  /**
   * Stop continuous zoom; optionally finalize with full-quality render and callback.
   */
  stopHoldZoom(settings: RenderSettings, onComplete?: (finalViewport: Viewport) => void): void {
    if (this.holdZoomFrameId) {
      cancelAnimationFrame(this.holdZoomFrameId);
      this.holdZoomFrameId = null;
    }

    if (this.holdLastViewport) {
      // Final high-quality render
      this.renderer.render(this.holdLastViewport, settings);
      this.lastViewport = this.holdLastViewport;
      this.lastSettings = settings;
      if (onComplete) {
        onComplete(this.holdLastViewport);
      }
    }

    this.holdLastViewport = null;
  }

  /**
   * Mark interaction started (dragging/zooming)
   */
  startInteraction(): void {
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
  }

  /**
   * Mark interaction ended
   */
  endInteraction(): void {
    // Schedule a full-quality render after debounce
    this.scheduleRender();
  }

  /**
   * Request a render with optional debouncing
   */
  render(viewport: Viewport, settings: RenderSettings, debounce: boolean = false): void {
    this.lastViewport = viewport;
    this.lastSettings = settings;

    if (debounce) {
      // Cancel previous debounce
      if (this.debounceTimeoutId) {
        clearTimeout(this.debounceTimeoutId);
      }

      // Schedule new render after debounce delay
      this.debounceTimeoutId = setTimeout(() => {
        this.performRender();
        this.debounceTimeoutId = null;
      }, this.DEBOUNCE_DELAY);
    } else {
      // Render immediately
      if (this.renderRequestId) {
        cancelAnimationFrame(this.renderRequestId);
      }

      this.renderRequestId = requestAnimationFrame(() => {
        this.performRender();
        this.renderRequestId = null;
      });
    }
  }

  private performRender(): void {
    if (!this.lastViewport || !this.lastSettings) {
      return;
    }
    
    // Update palette if needed
    const settings = this.lastSettings;
    this.renderer.updatePalette(settings.palette);

    // Perform render
    this.renderer.render(this.lastViewport, settings);
  }

  /**
   * Schedule a render at next animation frame
   */
  private scheduleRender(): void {
    if (this.renderRequestId) {
      cancelAnimationFrame(this.renderRequestId);
    }

    this.renderRequestId = requestAnimationFrame(() => {
      this.performRender();
      this.renderRequestId = null;
    });
  }

  /**
   * Cancel any pending renders
   */
  cancel(): void {
    if (this.holdZoomFrameId) {
      cancelAnimationFrame(this.holdZoomFrameId);
      this.holdZoomFrameId = null;
    }
    this.holdLastViewport = null;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.renderRequestId) {
      cancelAnimationFrame(this.renderRequestId);
      this.renderRequestId = null;
    }
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
  }

  /**
   * Get quality level based on preset
   */
  static getQualityIterations(quality: 'low' | 'medium' | 'high' | 'ultra'): number {
    switch (quality) {
      case 'low':
        return 64;
      case 'medium':
        return 128;
      case 'high':
        return 256;
      case 'ultra':
        return 512;
    }
  }

  /**
   * Get progressive quality iterations (lower during dragging)
   */
  static getProgressiveIterations(
    quality: 'low' | 'medium' | 'high' | 'ultra',
    isDragging: boolean
  ): number {
    const base = this.getQualityIterations(quality);
    if (isDragging) {
      // Reduce to low quality during dragging
      return Math.max(32, Math.floor(base / 4));
    }
    return base;
  }

  destroy(): void {
    this.cancel();
    this.renderer.destroy();
  }
}
