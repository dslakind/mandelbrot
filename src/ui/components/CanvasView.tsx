/**
 * Canvas view component with zoom selection rectangle
 */

import { useRef, useState } from 'react';
import { useAppStore, useViewport } from '../../state/store';
import { pixelToComplex, zoomToRect } from '../../core/viewport';
import './CanvasView.css';

interface CanvasViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  aspectRatio: number;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onCanvasClick?: (args: { x: number; y: number; canvasWidth: number; canvasHeight: number }) => void;
  onHoldZoomStart?: (args: { x: number; y: number; canvasWidth: number; canvasHeight: number }) => void;
  onHoldZoomStop?: () => void;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CanvasView({
  canvasRef,
  aspectRatio,
  onInteractionStart,
  onInteractionEnd,
  onCanvasClick,
  onHoldZoomStart,
  onHoldZoomStop,
}: CanvasViewProps) {
  const viewport = useViewport();
  const { pushViewportHistory } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const selectingRef = useRef(false);
  const didDragRef = useRef(false);
  const holdZoomingRef = useRef(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [holdZooming, setHoldZooming] = useState(false);
  const [didDrag, setDidDrag] = useState(false);

  const HOLD_DELAY_MS = 200;

  const clearHoldTimeout = () => {
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left-click

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setIsSelecting(true);
    setDidDrag(false);
    setHoldZooming(false);
    selectingRef.current = true;
    didDragRef.current = false;
    holdZoomingRef.current = false;
    onInteractionStart();

    clearHoldTimeout();
    holdTimeoutRef.current = window.setTimeout(() => {
      // Start hold-zoom only if still selecting and not dragged
      if (!didDragRef.current && selectingRef.current) {
        holdZoomingRef.current = true;
        setHoldZooming(true);
        onHoldZoomStart?.({ x, y, canvasWidth: rect.width, canvasHeight: rect.height });
      }
    }, HOLD_DELAY_MS);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });

    if (isSelecting && startPos) {
      // Calculate selection rectangle with aspect ratio constraint
      let width = x - startPos.x;
      let height = y - startPos.y;

      // If user drags beyond a small threshold, stop hold-zoom mode
      if (Math.abs(width) > 8 || Math.abs(height) > 8) {
        if (!didDragRef.current) {
          didDragRef.current = true;
          setDidDrag(true);
        }
        if (holdZoomingRef.current) {
          holdZoomingRef.current = false;
          setHoldZooming(false);
          onHoldZoomStop?.();
        }
        clearHoldTimeout();
      }

      const absWidth = Math.abs(width);
      const absHeight = Math.abs(height);

      // Maintain aspect ratio
      const constrainedHeight = absWidth / aspectRatio;
      const constrainedWidth = absHeight * aspectRatio;

      if (constrainedHeight <= absHeight) {
        height = Math.sign(height) * constrainedHeight;
      } else {
        width = Math.sign(width) * constrainedWidth;
      }

      const finalX = width >= 0 ? startPos.x : startPos.x + width;
      const finalY = height >= 0 ? startPos.y : startPos.y + height;

      setSelection({
        x: finalX,
        y: finalY,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent): void => {
    const rect = canvasRef.current?.getBoundingClientRect();

    clearHoldTimeout();

    if (holdZoomingRef.current) {
      holdZoomingRef.current = false;
      setHoldZooming(false);
      onHoldZoomStop?.();
      setIsSelecting(false);
      setSelection(null);
      setStartPos(null);
      setDidDrag(false);
      selectingRef.current = false;
      didDragRef.current = false;
      onInteractionEnd();
      return;
    }

    // Treat as click/hold (no or tiny selection)
    if (!isSelecting || !selection || selection.width < 20 || selection.height < 20) {
      setIsSelecting(false);
      setSelection(null);
      setStartPos(null);
      setDidDrag(false);
      selectingRef.current = false;
      didDragRef.current = false;
      onInteractionEnd();

      if (rect && onCanvasClick) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        onCanvasClick({
          x,
          y,
          canvasWidth: rect.width,
          canvasHeight: rect.height,
        });
      }
      return;
    }

    // Zoom to selection
    const canvasWidth = canvasRef.current?.clientWidth || 1;
          selectingRef.current = false;
          didDragRef.current = false;
    const canvasHeight = canvasRef.current?.clientHeight || 1;

    const newViewport = zoomToRect(
      viewport,
      selection,
      { width: canvasWidth, height: canvasHeight }
    );

    pushViewportHistory(newViewport);

    setIsSelecting(false);
    setSelection(null);
    setStartPos(null);
    setDidDrag(false);
            selectingRef.current = false;
            didDragRef.current = false;
    onInteractionEnd();
  };

  const handleMouseLeave = () => {
    clearHoldTimeout();
    setHoverPos(null);
    if (isSelecting) {
      setIsSelecting(false);
      setSelection(null);
      setStartPos(null);
      if (holdZooming) {
        setHoldZooming(false);
        onHoldZoomStop?.();
      }
      setDidDrag(false);
      onInteractionEnd();
    }
  };

  return (
    <div
      className="canvas-view"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="mandelbrot-canvas" />

      {selection && (
        <>
          <div className="selection-overlay" />
          <div
            className="selection-rect"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            }}
          />
        </>
      )}

      {hoverPos && (
        (() => {
          const canvasW = canvasRef.current?.clientWidth || 1;
          const canvasH = canvasRef.current?.clientHeight || 1;
          const infoWidth = 180;
          const infoHeight = 28;
          const padding = 12;

          let infoLeft = hoverPos.x + padding;
          let infoTop = hoverPos.y + padding;

          if (infoLeft + infoWidth > canvasW) {
            infoLeft = hoverPos.x - infoWidth - padding;
          }
          if (infoTop + infoHeight > canvasH) {
            infoTop = hoverPos.y - infoHeight - padding;
          }

          const complex = pixelToComplex(
            viewport,
            hoverPos.x,
            hoverPos.y,
            canvasW,
            canvasH
          );

          return (
            <div
              className="hover-overlay"
              style={{
                left: hoverPos.x,
                top: hoverPos.y,
              }}
            >
              <div className="crosshair" />
              <div
                className="hover-info"
                style={{ left: infoLeft - hoverPos.x, top: infoTop - hoverPos.y }}
              >
                {`Re: ${complex.re.toFixed(6)} Im: ${complex.im.toFixed(6)}`}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
