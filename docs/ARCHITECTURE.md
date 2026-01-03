# Architecture

## Module Breakdown

### Core Modules (`src/core/`)

Pure TypeScript modules with no React/DOM dependencies, fully testable.

#### `types.ts`
Defines all TypeScript interfaces:
- `Viewport`: Complex plane view bounds and dimensions
- `RenderSettings`: Max iterations, coloring mode, gamma, palette selection
- `Rect`: Pixel-space rectangle (for zoom selection)
- `ComplexPoint`: Real + imaginary components
- `RenderStats`: Performance metrics (render time, frame time)

#### `viewport.ts`
Utilities for viewport transformation and zoom:
- `createViewport()`: Factory for viewport objects
- `resetViewport(aspect)`: Default home view
- `pixelToComplex()`: Pixel → complex plane mapping (handles DPR, viewport bounds)
- `complexToPixel()`: Inverse mapping
- `zoomToRect()`: Convert selection rectangle → new viewport (aspect-preserving)
- `getViewportBounds()`: Get complex plane extent
- `getZoomFactor()`: Zoom level relative to default view

#### `mandelbrot.ts`
CPU reference implementation:
- `escapeIterations(cRe, cIm, maxIter)`: Discrete iteration count (0..maxIter)
- `smoothEscape(cRe, cIm, maxIter)`: Smooth continuous value with log interpolation
- `batchIterations()`: Compute grid of points (useful for CPU export)

#### `palette.ts`
Palette generation and sampling:
- `generatePalette(name, steps, gamma)`: Create Uint8Array RGBA texture
- `getPaletteNames()`: List available palettes
- `samplePalette(palette, t)`: Sample 0..1 → RGBA color
- `applyGamma()`: Gamma correction curve
- Built-in palettes: Classic, Viridis, Inferno, Ice, Sunset

### State Management (`src/state/`)

#### `store.ts`
Zustand store:
- **State**:
  - `viewport`: Current complex plane view
  - `viewportHistory`: Undo stack
  - `viewportFuture`: Redo stack
  - `renderSettings`: Iterations, palette, smooth mode, gamma, quality preset, zoomFactor, debugMode
  - `sidePanelOpen`: UI state
  - `renderStats`: Performance metrics
  - `isExporting`: Export progress state

- **Actions**:
  - `setViewport()`: Set current view (clears redo stack)
  - `pushViewportHistory()`: Push current → history, set new viewport
  - `undo()` / `redo()`: Navigate history stacks
  - `reset()`: Return to default home view (pushes to history)
  - `updateRenderSettings()`: Partial update of render config
  - `setSidePanelOpen()`, `setExporting()`, `setRenderStats()`: UI updates

- **Selectors** (for efficient component subscriptions):
  - `useViewport()`: Current viewport
  - `useCanUndo()` / `useCanRedo()`: Enable/disable buttons
  - `useRenderSettings()`: All render config
  - `useSidePanelOpen()`: Panel state
  - `useExportState()`: Export progress
  - `useRenderStats()`: Performance stats

### Rendering (`src/renderer/`)

#### `webgl/shaders.ts`
GLSL shader code strings:
- **Vertex Shader**: Full-screen quad (trivial, just passes fragment coordinates)
- **Fragment Shader**: 
  - Unpacks fragment coordinates to complex plane
  - Performs Mandelbrot iteration loop
  - Applies smooth coloring if enabled
  - Samples palette texture
  - Applies gamma correction

Uniforms:
- `centerRe`, `centerIm`: Viewport center
- `viewWidth`, `viewHeight`: Viewport dimensions
- `maxIterations`: Iteration limit
- `smoothColoring`: Boolean toggle
- `gamma`: Gamma exponent
- `insideColor`: RGB for interior points
- `paletteSampler`: 1D palette texture

#### `webgl/renderer.ts`
WebGL2 rendering pipeline:
- `setupProgram()`: Compile, link shaders
- `setupGeometry()`: Full-screen quad VAO/VBO
- `setupPalette()`: Generate and upload palette texture (RGBA_8, 256×1)
- `render()`: Set uniforms, bind texture, draw
- `updatePalette()`: Regenerate palette on setting change
- `destroy()`: Clean up resources

Handles devicePixelRatio scaling automatically.

#### `renderController.ts`
High-level rendering orchestration:
- Progressive refinement: lowers iterations during drag/hold animations, restores full quality after interaction
- Debouncing: delay full-quality render after interaction stops (~200 ms)
- Request frame scheduling with `requestAnimationFrame`
- Smooth click zoom: `animateZoom` eases toward a point with temporary low iterations, then final high-quality render
- Click-and-hold zoom: `startHoldZoom` continuously shrinks viewport toward pointer until `stopHoldZoom`
- Palette sync: `updatePalette` invoked before renders/animations to reflect UI changes
- Quality scaling: `getProgressiveIterations(quality, isDragging)`
- Cancelation: `cancel()` clears pending animation frames and debounce timers

Flow:
1. User interacts → `startInteraction()` (sets isDragging=true)
2. Immediate low-quality render
3. User stops → `endInteraction()` (sets isDragging=false)
4. Debounce timer starts
5. After ~200ms, full-quality render fires
6. If settings change before timer, restart debounce

### React UI (`src/ui/`)

#### `App.tsx`
Top-level component:
- Initializes WebGL2Renderer and RenderController
- Manages canvas reference and lifecycle
- Subscribes to store (viewport, settings, stats)
- Handles window resize
- Triggers render on viewport/settings changes
- Passes interaction callbacks to CanvasView

#### `components/TopBar.tsx`
Header bar:
- App title "Mandelbrot Explorer"
- Action buttons: Home, Undo, Redo, Save PNG, Export Hi-Res
- Status indicators: renderer mode (WebGL2), readiness

#### `components/SidePanel.tsx`
Collapsible left panel with three sections:

**View**:
- Max Iterations slider + number input (16–2048)
- Progressive Refinement toggle
- Reduce Quality While Dragging toggle
- Click Zoom Factor slider/input (controls animated click zoom multiplier)

**Color**:
- Palette dropdown
- Smooth Coloring toggle
- Gamma slider (0.1–3.0)
- Inside Color picker (RGB)
- Debug View dropdown (None, Gradient, Grayscale)

**Performance**:
- Quality preset buttons (Low/Medium/High/Ultra)
- Maps to iteration counts (64/128/256/512)

#### `components/CanvasView.tsx`
Main canvas area with interaction:
- Full-screen canvas for rendering
- Pointer event handling for zoom selection:
  - `pointerdown`: Record start, arm hold-zoom timer (~200 ms)
  - `pointermove`: Draw translucent rectangle with aspect lock; dragging cancels hold-zoom
  - `pointerup`: If hold-zoom active, finalize continuous zoom; else treat as click (smooth zoom) or selection zoom
- Overlay elements:
  - Dimmed background during selection
  - Selection rectangle (border + semi-transparent fill)
  - Hover info: complex coordinates, iteration count (future)
  - Subtle crosshair cursor

#### `components/StatusBar.tsx`
Footer bar with real-time metrics:
- Zoom factor (x relative to default)
- Max iterations
- Palette name
- Coloring mode (Smooth/Discrete)
- Last render time (ms)
- Canvas resolution (CSS px + DPR)

## Data Flow

### Rendering Cycle

```
User changes viewport or settings
    ↓
store.setViewport() or store.updateRenderSettings()
    ↓
App.useViewport() / App.useRenderSettings() → re-render
    ↓
RenderController.render(viewport, settings)
    ↓
WebGL2Renderer.render()
    ├─ update uniforms from viewport/settings
    ├─ bind palette texture
    ├─ draw full-screen quad
    └─ report stats
```

### Zoom Selection Flow

```
User clicks and drags on canvas
    ↓
CanvasView.onPointerDown → setIsSelecting(true), record start pos
    ↓
CanvasView.onPointerMove → calculate rect with aspect ratio constraint
    ↓
RenderController.startInteraction() → isDragging = true
    ↓
(immediate fast render with low iterations)
    ↓
User releases pointer
    ↓
CanvasView.onPointerUp:
  ├─ zoomToRect(viewport, rect, canvasSize) → new viewport
  ├─ store.pushViewportHistory(newViewport) → updates store
  └─ RenderController.endInteraction() → isDragging = false, schedules debounce
    ↓
~200ms later:
  ├─ Full-quality render fires
  └─ store updates, all connected components re-render
```

### Click / Hold Zoom Flow

```
User clicks canvas (no drag)
    ↓
CanvasView classifies interaction after short delay
    ↓
If click-and-hold detected:
  RenderController.startHoldZoom(viewport, settings, target)
    ↓ (continuous low-iteration renders)
  Pointer up → RenderController.stopHoldZoom(settings) → final render → push history
Else (simple click):
  RenderController.animateZoom(...) → eased zoom → final render → push history
```

### History Navigation

```
store.undo():
  ├─ pop from viewportHistory
  ├─ push current viewport to viewportFuture
  └─ setViewport(previous)
    ↓
    Triggers render with new viewport

store.redo():
  ├─ shift from viewportFuture
  ├─ push current viewport to viewportHistory
  └─ setViewport(next)
```

## Testing Strategy

### Unit Tests (`tests/`)
- **mandelbrot.test.ts**: Correctness of CPU reference (inside/outside detection, smooth values)
- **viewport.test.ts**: Coordinate mapping, zoom selection, aspect ratio preservation
- **palette.test.ts**: Palette generation, gamma correction, sampling

All core modules are testable without DOM or React.

### E2E Tests (Playwright, future)
- Load app, verify canvas visible
- Perform drag-zoom, verify viewport changed
- Undo/Redo, verify viewport readout updated
- Reset, verify home view restored
- Export PNG, verify download

No pixel-perfect assertions (fractal varies by floating-point precision).

## Performance Considerations

1. **WebGL2**: All heavy lifting on GPU (fragment shader in parallel)
2. **Progressive Refinement**: Low iterations during drag, full after
3. **Debounced Render**: Avoid render spam during rapid setting changes
4. **Memoization**: Zustand selectors prevent unnecessary re-renders
5. **Canvas Resizing**: Handled gracefully with DPR scaling

Quality presets balance visual quality vs. responsiveness. "Ultra" at 512 iterations may be slower but higher fidelity for exports.

## References
- Vite React starter template (MIT): https://vitejs.dev/guide/
- Smooth coloring approach: Wikipedia, "Mandelbrot set" — https://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_(smooth)_coloring
- Viridis colormap values (CC0) from matplotlib: https://github.com/matplotlib/matplotlib/blob/main/lib/matplotlib/_cm_listed.py
- Architecture notes compiled collaboratively by dslakind with AI assistance from GitHub Copilot (GPT-5.1-Codex-Max) in this chat session
