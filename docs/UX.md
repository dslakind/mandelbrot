# UX Design & Interaction Model

## Philosophy

The Mandelbrot Explorer prioritizes **responsiveness**, **visual polish**, and **intuitive interaction**. No action should freeze the UI. Every interaction provides visual feedback.

## Zoom Interaction — Click, Hold, Drag Rectangle

### Why This Approach?

Traditional zoom methods:
- **Scroll wheel**: Fast but imprecise; difficult to zoom to exact region
- **Double-click**: Quick but limited zoom levels
- **Pan + discrete zoom buttons**: Multiple steps, tedious
- **Free selection drag**: Risk of stretching aspect ratio

**Rectangle selection** offers:
- ✓ Precise: User directly specifies region
- ✓ Intuitive: Works like selection in image editors
- ✓ Aspect-safe: We automatically maintain canvas aspect ratio
- ✓ Visual feedback: Overlay shows exact selection area

### Interaction Flow

```
1. Pointer down on canvas
  → Record start position
  → Arm hold-zoom timer (~200 ms) but do not act yet

2a. If pointer stays still past the timer
  → Start continuous zoom toward pointer (low-iteration renders for responsiveness)
  → On release, finalize with full-quality render and push history

2b. If user drags before timer fires
  → Cancel hold-zoom
  → Draw selection rectangle (aspect-locked), semi-transparent fill + border

3. Pointer up
  → If a hold-zoom was active: stop, finalize render, push history
  → Else if rectangle is tiny: treat as click; trigger smooth animated zoom to pointer
  → Else: zoom to rectangle, push history

4. After interaction ends
  → Debounce (~200 ms) then run full-quality render
  → UI remains responsive throughout
```

### Aspect Ratio Preservation

When user drags a rectangle:

```
Canvas aspect ratio: 16:9
User drags: 600×400 pixels (aspect 1.5:1)

Since 1.5:1 < 16:9:
  → Keep height at 400
  → Reduce width to 400 × (16/9) ≈ 711 pixels

Visual feedback: Rectangle snaps to correct aspect while dragging
```

The user sees the rectangle adjust in real time, making it clear what region will be selected.

## Progressive Refinement

### Problem

High iteration counts produce beautiful detail but render slowly. During zoom selection and panning, the user wants responsive feedback, not a stuck UI.

### Solution

Render quality varies based on interaction state:

```
State: IDLE (no interaction)
  Render Settings:
    iterations = quality preset (256 for "High")
    debounce = none
    refresh = immediate

State: DRAGGING (selection/zoom in progress)
  Render Settings:
    iterations = quality ÷ 4 (64 for "High")
    debounce = none
    refresh = immediate (every frame)
  Visual effect: Grainier but fast (~60 FPS)

State: INTERACTION_ENDED
  Debounce timer: ~200ms
  At timer expiry:
    iterations = full quality (256 for "High")
    debounce = restart timer on new change
    refresh = next animation frame
  Visual effect: Wait briefly, then sharp render
```

This "feels" responsive without visible UI stalls.

### Quality Presets

Map to baseline iteration counts (no dragging):

| Preset | Iterations | Target FPS | Use Case |
|--------|-----------|-----------|----------|
| Low    | 64        | 60 FPS    | Exploration, slow hardware |
| Medium | 128       | 45 FPS    | Balanced |
| High   | 256       | 30 FPS    | **Default**, good detail |
| Ultra  | 512       | 15 FPS    | Export, high detail |

During dragging, each is divided by ~4x.

### Debug Views

- **None**: normal palette coloring (default)
- **Gradient**: UV debug gradient to verify coordinate mapping
- **Grayscale**: Iteration-based grayscale to inspect escape bands

Accessible via the "Debug View" dropdown in the Color section of the side panel.

## Undo / Redo / Reset

### Undo/Redo Stack

Every zoom action pushes the **previous** viewport onto the undo stack:

```typescript
store.pushViewportHistory(newViewport):
  viewportHistory = [...viewportHistory, currentViewport]
  currentViewport = newViewport
  viewportFuture = [] // Clear redo

store.undo():
  if (viewportHistory.length > 0):
    previous = viewportHistory.pop()
    viewportFuture = [currentViewport, ...viewportFuture]
    currentViewport = previous

store.redo():
  if (viewportFuture.length > 0):
    next = viewportFuture.shift()
    viewportHistory = [...viewportHistory, currentViewport]
    currentViewport = next
```

Button states:
- Undo button: **disabled** if `viewportHistory.length === 0`
- Redo button: **disabled** if `viewportFuture.length === 0`

### Reset

Clears all future history and returns to default view:

```
store.reset():
  viewportHistory = [...viewportHistory, currentViewport]
  currentViewport = resetViewport(canvasAspect)
  viewportFuture = []
```

This ensures reset is also undoable.

## Status Display

### Real-Time Metrics (StatusBar)

Updated on every render:

```
[Zoom: 2.5×] [Iterations: 256] [Palette: Viridis] 
[Mode: Smooth] [Render: 12ms] [Resolution: 1920×1080 (DPR: 2.0)]
```

- **Zoom**: Relative to default view (1.0× = fully zoomed out)
- **Iterations**: Current setting
- **Palette**: Selected colormap name
- **Mode**: "Smooth" or "Discrete"
- **Render**: Time for last GPU render (not blocking)
- **Resolution**: Canvas CSS size + device pixel ratio

### Hover Overlay

When mouse hovers over canvas:

```
┌─────────────────────┐
│ Mandelbrot Canvas   │
│                     │
│         + (crosshair, 1px lines)
│        ╱ │ ╲        
│       ╱  │  ╲ Re: -0.751234
│      │   │   │ Im: -0.087654
│       ╲  │  ╱ 
│        ╲ │ ╱ 
│                     │
└─────────────────────┘
```

Complex coordinates in green monospace font (hacker aesthetic).

Disappears on mouse leave for clean canvas.

## Export

### Save PNG (Immediate)

```
button "Save PNG" clicked
  ↓
canvas.toDataURL('image/png')
  ↓
Create <a> link with download
  ↓
User's downloads folder: mandelbrot.png
```

No blocking, instant feedback.

### Export High-Res (Future)

```
button "Export Hi-Res" clicked
  ↓
Modal dialog:
  "Export Mandelbrot Set"
  Width: [3840] px
  Height: [auto-calculated to maintain aspect]
  [Cancel] [Export]
  ↓
User clicks "Export"
  ↓
Send to Worker:
  viewport, settings, target dimensions
  ↓
Worker renders tiles (e.g., 512×512 chunks):
  [████████░░░░░░░░] 40% done...
  ↓
Main thread gets ImageData chunks, assembles in canvas
  ↓
Download PNG (or show "Save As" dialog)
  
Total time: 10–60 seconds depending on resolution/iterations
UI remains responsive during export
```

Progress bar shows tile-by-tile progress.

## Visual Polish

### Transitions & Animations

- **Panel collapse**: Slide-out transition (200ms)
- **Button hover**: Color fade (150ms)
- **Selection rectangle**: Appears/fades smoothly
- **Zoom transition**: Optional: smoothly pan/zoom to new viewport over 300ms (currently instant for precision)

### Color Scheme

Dark theme (VS Code inspired):
- Background: `#1e1e1e` (very dark gray)
- Panels: `#252526`
- Borders: `#3e3e42`
- Text: `#e0e0e0` (light gray)
- Accents: `#007acc` (blue, VS Code accent color)
- Selection: `#00bfff` (cyan, high contrast)

Provides eye-comfortable dark UI suitable for extended exploration.

### Accessibility

- ✓ High contrast (WCAG AA)
- ✓ Keyboard shortcuts (Ctrl+Z undo, Ctrl+Y redo, arrows for nav — future)
- ✓ Touch-friendly: Pointer events work on mobile
- ✓ Screen reader hints (aria labels — future)
- ✓ Colorblind-friendly palettes (Viridis, Inferno are perceptually uniform)

## Mobile Considerations

**Not a priority for v1**, but framework supports:
- Pointer events (works on touch)
- Responsive canvas scaling
- Touch rectangle selection (press-hold-drag works like mouse)

Future: Pinch-to-zoom, mobile-optimized UI layout.

## Performance Targets

- **Drag responsiveness**: < 100ms latency (feels instant)
- **Full render**: < 500ms for "High" quality at 1080p
- **Export time**: ~ 1 second per megapixel (tile-based)
- **Memory**: < 500 MB (with multiple undo steps)

No frame drops during interaction is the golden rule.

## References
- Base color palette inspiration and accessible defaults: Viridis colormap (CC0) from matplotlib — https://github.com/matplotlib/matplotlib/blob/main/lib/matplotlib/_cm_listed.py
- Smooth coloring explanation: Wikipedia, "Mandelbrot set" — https://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_(smooth)_coloring
