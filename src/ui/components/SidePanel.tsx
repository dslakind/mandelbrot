/**
 * Side panel with controls
 */

import { useAppStore, useRenderSettings, useSidePanelOpen } from '../../state/store';
import { getPaletteNames } from '../../core/palette';
import './SidePanel.css';

export default function SidePanel() {
  const sidePanelOpen = useSidePanelOpen();
  const { setSidePanelOpen, updateRenderSettings } = useAppStore();
  const settings = useRenderSettings();

  const handleToggle = () => {
    setSidePanelOpen(!sidePanelOpen);
  };

  const handleIterationsChange = (value: number) => {
    updateRenderSettings({ maxIterations: value });
  };

  const handlePaletteChange = (palette: string) => {
    updateRenderSettings({ palette });
  };

  const handleSmoothColoringChange = (checked: boolean) => {
    updateRenderSettings({ smoothColoring: checked });
  };

  const handleGammaChange = (value: number) => {
    updateRenderSettings({ gamma: Math.max(0.1, value) });
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high' | 'ultra') => {
    updateRenderSettings({ quality });
  };

  const handleDebugModeChange = (mode: 'none' | 'gradient' | 'grayscale') => {
    updateRenderSettings({ debugMode: mode });
  };

  const paletteNames = getPaletteNames();

  return (
    <>
      <button className="panel-toggle" onClick={handleToggle}>
        {sidePanelOpen ? '◄' : '►'}
      </button>

      {sidePanelOpen && (
        <div className="side-panel">
          <h2>Controls</h2>

          {/* View Section */}
          <section className="control-section">
            <h3>View</h3>

            <div className="control-group">
              <label>Max Iterations</label>
              <div className="input-row">
                <input
                  type="range"
                  min="16"
                  max="2048"
                  value={settings.maxIterations}
                  onChange={(e) => handleIterationsChange(parseInt(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  min="16"
                  max="2048"
                  value={settings.maxIterations}
                  onChange={(e) => handleIterationsChange(parseInt(e.target.value))}
                  className="number-input"
                />
              </div>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.progressiveRefinement}
                  onChange={(e) =>
                    updateRenderSettings({ progressiveRefinement: e.target.checked })
                  }
                />
                Progressive Refinement
              </label>
              <p className="helper-text">Refine quality after interaction</p>
            </div>

            <div className="control-group">
              <label>Click Zoom Factor</label>
              <div className="input-row">
                <input
                  type="range"
                  min="1.2"
                  max="5"
                  step="0.1"
                  value={settings.zoomFactor ?? 2}
                  onChange={(e) => updateRenderSettings({ zoomFactor: parseFloat(e.target.value) })}
                  className="slider"
                />
                <input
                  type="number"
                  min="1.2"
                  max="5"
                  step="0.1"
                  value={(settings.zoomFactor ?? 2).toFixed(1)}
                  onChange={(e) => updateRenderSettings({ zoomFactor: parseFloat(e.target.value) })}
                  className="number-input"
                />
              </div>
              <p className="helper-text">Click to smoothly zoom toward a point</p>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.reduceQualityWhileDragging}
                  onChange={(e) =>
                    updateRenderSettings({ reduceQualityWhileDragging: e.target.checked })
                  }
                />
                Reduce Quality While Dragging
              </label>
              <p className="helper-text">Lower iterations for faster interaction</p>
            </div>
          </section>

          {/* Color Section */}
          <section className="control-section">
            <h3>Color</h3>

            <div className="control-group">
              <label>Palette</label>
              <select
                value={settings.palette}
                onChange={(e) => handlePaletteChange(e.target.value)}
                className="select"
              >
                {paletteNames.map((name) => (
                  <option key={name} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.smoothColoring}
                  onChange={(e) => handleSmoothColoringChange(e.target.checked)}
                />
                Smooth Coloring
              </label>
              <p className="helper-text">Smooth color transition (less banding)</p>
            </div>

            <div className="control-group">
              <label>Gamma</label>
              <div className="input-row">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.gamma}
                  onChange={(e) => handleGammaChange(parseFloat(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={settings.gamma.toFixed(1)}
                  onChange={(e) => handleGammaChange(parseFloat(e.target.value))}
                  className="number-input"
                />
              </div>
            </div>

            <div className="control-group">
              <label>Debug View</label>
              <select
                value={settings.debugMode ?? 'none'}
                onChange={(e) => handleDebugModeChange(e.target.value as 'none' | 'gradient' | 'grayscale')}
                className="select"
              >
                <option value="none">None</option>
                <option value="gradient">Gradient (UV)</option>
                <option value="grayscale">Grayscale Iterations</option>
              </select>
              <p className="helper-text">Use to verify coordinates or iterations</p>
            </div>

            <div className="control-group">
              <label>Inside Color</label>
              <input
                type="color"
                value={
                  '#' +
                  [0, 1, 2]
                    .map((i) =>
                      Math.round(settings.insideColor[i] * 255)
                        .toString(16)
                        .padStart(2, '0')
                    )
                    .join('')
                }
                onChange={(e) => {
                  const hex = e.target.value.slice(1);
                  const color: [number, number, number] = [
                    parseInt(hex.slice(0, 2), 16) / 255,
                    parseInt(hex.slice(2, 4), 16) / 255,
                    parseInt(hex.slice(4, 6), 16) / 255,
                  ];
                  updateRenderSettings({ insideColor: color });
                }}
                className="color-picker"
              />
            </div>
          </section>

          {/* Performance Section */}
          <section className="control-section">
            <h3>Performance</h3>

            <div className="control-group">
              <label>Quality</label>
              <div className="quality-buttons">
                {(['low', 'medium', 'high', 'ultra'] as const).map((q) => (
                  <button
                    key={q}
                    className={`quality-btn ${settings.quality === q ? 'active' : ''}`}
                    onClick={() => handleQualityChange(q)}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
