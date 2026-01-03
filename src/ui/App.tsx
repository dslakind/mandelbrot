/**
 * Main App component
 */

import { useEffect, useRef, useState } from 'react';
import { useAppStore, useViewport, useRenderSettings } from '../state/store';
import { pixelToComplex } from '../core/viewport';
import { WebGL2Renderer } from '../renderer/webgl/renderer';
import { RenderController } from '../renderer/renderController';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import CanvasView from './components/CanvasView';
import StatusBar from './components/StatusBar';
import './App.css';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<RenderController | null>(null);
  const initialViewportSynced = useRef(false);

  const viewport = useViewport();
  const settings = useRenderSettings();
  const { setRenderStats, reset, pushViewportHistory } = useAppStore();

  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  // When we get the real aspect ratio the first time, reset the viewport so the
  // initial view covers the full set with correct padding on this device.
  useEffect(() => {
    if (!initialViewportSynced.current && aspectRatio > 0) {
      reset(aspectRatio);
      initialViewportSynced.current = true;
    }
  }, [aspectRatio, reset]);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const renderer = new WebGL2Renderer({
        canvas: canvasRef.current,
        onStatsUpdate: (stats) => setRenderStats(stats),
      });

      const controller = new RenderController(renderer);
      controllerRef.current = controller;

      // Initial setup
      updateCanvasSize();
        performRender(viewport, settings);

      return () => {
        controller.destroy();
      };
    } catch (error) {
      console.error('Failed to initialize renderer:', error);
    }
  }, [setRenderStats]);

  // Handle viewport and settings changes
  useEffect(() => {
    performRender(viewport, settings);
  }, [viewport, settings]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize();
      performRender(viewport, settings);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewport, settings]);

  const updateCanvasSize = () => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newAspectRatio = rect.width / rect.height;
    setAspectRatio(newAspectRatio);
  };

  const performRender = (vp: typeof viewport, cfg: typeof settings) => {
    if (!controllerRef.current) return;

    const adjustedSettings = {
      ...cfg,
      maxIterations: RenderController.getProgressiveIterations(cfg.quality, false),
    };

    controllerRef.current.render(vp, adjustedSettings, false);
  };

  const handleCanvasInteractionStart = () => {
    controllerRef.current?.startInteraction();
  };

  const handleCanvasInteractionEnd = () => {
    controllerRef.current?.endInteraction();
  };

  const handleCanvasClick = ({ x, y, canvasWidth, canvasHeight }: { x: number; y: number; canvasWidth: number; canvasHeight: number }) => {
    const controller = controllerRef.current;
    if (!controller) return;

    const target = pixelToComplex(viewport, x, y, canvasWidth, canvasHeight);
    const zoomFactor = settings.zoomFactor ?? 2;

    controller.animateZoom(
      viewport,
      settings,
      { re: target.re, im: target.im },
      aspectRatio,
      (finalViewport) => pushViewportHistory(finalViewport)
    );
  };

  const handleHoldZoomStart = ({ x, y, canvasWidth, canvasHeight }: { x: number; y: number; canvasWidth: number; canvasHeight: number }) => {
    const controller = controllerRef.current;
    if (!controller) return;
    const target = pixelToComplex(viewport, x, y, canvasWidth, canvasHeight);
    controller.startHoldZoom(viewport, settings, { re: target.re, im: target.im }, aspectRatio);
  };

  const handleHoldZoomStop = () => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.stopHoldZoom(settings, (finalVp) => pushViewportHistory(finalVp));
  };

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <SidePanel />
        <CanvasView
          canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
          aspectRatio={aspectRatio}
          onInteractionStart={handleCanvasInteractionStart}
          onInteractionEnd={handleCanvasInteractionEnd}
          onCanvasClick={handleCanvasClick}
          onHoldZoomStart={handleHoldZoomStart}
          onHoldZoomStop={handleHoldZoomStop}
        />
      </div>
      <StatusBar />
    </div>
  );
}
