/**
 * Status bar component
 */

import { useRenderStats, useRenderSettings, useViewport } from '../../state/store';
import { getZoomFactor } from '../../core/viewport';
import './StatusBar.css';

export default function StatusBar() {
  const stats = useRenderStats();
  const settings = useRenderSettings();
  const viewport = useViewport();

  const zoomFactor = getZoomFactor(viewport);
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const resolution = canvas
    ? `${canvas.clientWidth}×${canvas.clientHeight} (DPR: ${dpr.toFixed(1)})`
    : 'Loading...';

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="label">Zoom:</span>
        <span className="value">{zoomFactor.toFixed(1)}×</span>
      </div>

      <div className="status-item">
        <span className="label">Iterations:</span>
        <span className="value">{settings.maxIterations}</span>
      </div>

      <div className="status-item">
        <span className="label">Palette:</span>
        <span className="value">{settings.palette}</span>
      </div>

      <div className="status-item">
        <span className="label">Mode:</span>
        <span className="value">{settings.smoothColoring ? 'Smooth' : 'Discrete'}</span>
      </div>

      <div className="status-item">
        <span className="label">Render:</span>
        <span className="value">{stats.renderTime}ms</span>
      </div>

      <div className="status-item">
        <span className="label">Resolution:</span>
        <span className="value">{resolution}</span>
      </div>
    </div>
  );
}
