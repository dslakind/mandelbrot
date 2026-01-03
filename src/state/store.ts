/**
 * Global state management using Zustand
 */

import { create } from 'zustand';
import type { Viewport, RenderSettings, RenderStats } from '../core/types';
import { resetViewport } from '../core/viewport';

interface AppState {
  // Viewport and history
  viewport: Viewport;
  viewportHistory: Viewport[];
  viewportFuture: Viewport[];

  // Render settings
  renderSettings: RenderSettings;

  // UI state
  sidePanelOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  renderStats: RenderStats;

  // Actions
  setViewport: (viewport: Viewport) => void;
  pushViewportHistory: (viewport: Viewport) => void;
  undo: () => void;
  redo: () => void;
  reset: (aspectRatio: number) => void;

  updateRenderSettings: (settings: Partial<RenderSettings>) => void;
  setSidePanelOpen: (open: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setRenderStats: (stats: Partial<RenderStats>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  viewport: resetViewport(16 / 9),
  viewportHistory: [],
  viewportFuture: [],

  renderSettings: {
    maxIterations: 256,
    smoothColoring: true,
    gamma: 1.0,
    insideColor: [0.25, 1.0, 0.1],
    palette: 'classic',
    quality: 'high',
    progressiveRefinement: true,
    reduceQualityWhileDragging: true,
    debugMode: 'none',
    zoomFactor: 2,
  },

  sidePanelOpen: true,
  isExporting: false,
  exportProgress: 0,
  renderStats: {
    iterationCount: 0,
    renderTime: 0,
    frameTime: 0,
  },

  // Actions
  setViewport: (viewport: Viewport) => {
    set({ viewport });
    set({ viewportFuture: [] }); // Clear redo stack on new navigation
  },

  pushViewportHistory: (viewport: Viewport) => {
    const current = get().viewport;
    // Only push if different from current
    if (
      current.centerRe !== viewport.centerRe ||
      current.centerIm !== viewport.centerIm ||
      current.width !== viewport.width ||
      current.height !== viewport.height
    ) {
      set(state => ({
        viewportHistory: [...state.viewportHistory, current],
        viewport,
        viewportFuture: [],
      }));
    }
  },

  undo: () => {
    const { viewportHistory, viewport } = get();
    if (viewportHistory.length > 0) {
      const newHistory = [...viewportHistory];
      const previous = newHistory.pop()!;
      set({
        viewport: previous,
        viewportHistory: newHistory,
        viewportFuture: [viewport, ...get().viewportFuture],
      });
    }
  },

  redo: () => {
    const { viewportFuture, viewport } = get();
    if (viewportFuture.length > 0) {
      const newFuture = [...viewportFuture];
      const next = newFuture.shift()!;
      set({
        viewport: next,
        viewportHistory: [...get().viewportHistory, viewport],
        viewportFuture: newFuture,
      });
    }
  },

  reset: (aspectRatio: number) => {
    const current = get().viewport;
    const reset = resetViewport(aspectRatio);
    set({
      viewport: reset,
      viewportHistory: [...get().viewportHistory, current],
      viewportFuture: [],
    });
  },

  updateRenderSettings: (settings: Partial<RenderSettings>) => {
    set(state => ({
      renderSettings: { ...state.renderSettings, ...settings },
    }));
  },

  setSidePanelOpen: (open: boolean) => {
    set({ sidePanelOpen: open });
  },

  setExporting: (exporting: boolean) => {
    set({ isExporting: exporting });
  },

  setExportProgress: (progress: number) => {
    set({ exportProgress: Math.max(0, Math.min(1, progress)) });
  },

  setRenderStats: (stats: Partial<RenderStats>) => {
    set(state => ({
      renderStats: { ...state.renderStats, ...stats },
    }));
  },
}));

// Selectors for efficient component subscriptions
export const useViewport = () => useAppStore(state => state.viewport);
export const useCanUndo = () => useAppStore(state => state.viewportHistory.length > 0);
export const useCanRedo = () => useAppStore(state => state.viewportFuture.length > 0);
export const useRenderSettings = () => useAppStore(state => state.renderSettings);
export const useSidePanelOpen = () => useAppStore(state => state.sidePanelOpen);
export const useExportState = () => useAppStore(state => ({
  isExporting: state.isExporting,
  progress: state.exportProgress,
}));
export const useRenderStats = () => useAppStore(state => state.renderStats);
