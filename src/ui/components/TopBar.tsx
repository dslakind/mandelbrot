/**
 * TopBar component with app title and action buttons
 */

import { useAppStore, useCanUndo, useCanRedo } from '../../state/store';
import './TopBar.css';

export default function TopBar() {
  const { undo, redo, reset } = useAppStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const handleReset = () => {
    reset(window.innerWidth / window.innerHeight);
  };

  const handleSavePNG = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'mandelbrot.png';
    link.click();
  };

  const handleExportHighRes = () => {
    alert('Export high-res feature coming soon!');
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1>Mandelbrot Explorer</h1>
      </div>

      <div className="top-bar-center">
        <button
          className="icon-button"
          onClick={handleReset}
          title="Reset view to home"
        >
          ⌂ Home
        </button>
        <button
          className="icon-button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ← Undo
        </button>
        <button
          className="icon-button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          Redo →
        </button>
        <button
          className="icon-button"
          onClick={handleSavePNG}
          title="Save current view as PNG"
        >
          💾 Save PNG
        </button>
        <button
          className="icon-button"
          onClick={handleExportHighRes}
          title="Export high resolution"
        >
          📤 Export Hi-Res
        </button>
      </div>

      <div className="top-bar-right">
        <span className="status-text">WebGL2</span>
        <span className="status-text">Ready</span>
      </div>
    </div>
  );
}
