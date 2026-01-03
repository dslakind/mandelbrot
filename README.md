# Mandelbrot Explorer

Interactive Mandelbrot set explorer built with React, TypeScript, Vite, and a WebGL2 renderer. The app focuses on smooth navigation (click, drag, click-and-hold zoom), high-quality coloring, and responsive feedback.

## Key Features
- WebGL2 fragment shader renderer with smooth or discrete coloring and gamma control
- Palette switcher (classic, viridis, inferno, ice, sunset) and inside-color picker
- Smooth click-to-zoom animation with configurable zoom factor
- Click-and-hold continuous zoom toward the pointer (cancellable by drag or release)
- Aspect-ratio-preserving drag-to-zoom rectangle with undo/redo history
- Progressive refinement: faster low-iteration renders during interaction, full quality after debounce
- Debug views (none, UV gradient, grayscale iterations) toggled in the UI
- Status bar with iteration count, palette, mode, render time, and resolution readout

## Quick Start
```bash
npm install
npm run dev
```
Then open the printed local URL (default http://localhost:5173).

## Controls
- Click: smooth zoom toward the pointer using the "Click Zoom Factor" from the side panel
- Click and hold (~200 ms): continuous zoom toward the pointer until release
- Drag: draw a rectangle to zoom into that region (aspect ratio preserved); releasing applies zoom and records history
- Undo / Redo: buttons in the top bar
- Reset (Home): return to the default viewport for the current aspect ratio
- Palette, gamma, smooth coloring, iterations, quality: adjust in the side panel
- Debug View: switch between normal rendering, UV gradient, and grayscale iteration visualization
- Save PNG: quick export of the current canvas

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm test -- --run` – run Vitest suite

## Code Map
- Rendering: `src/renderer/` (`webgl/renderer.ts`, `webgl/shaders.ts`, `renderController.ts`)
- Core math/types: `src/core/` (viewport math, palette generation, CPU reference)
- State: `src/state/store.ts` (Zustand)
- UI: `src/ui/` (App shell, CanvasView, SidePanel, TopBar, StatusBar)

## Interaction Details
- Progressive refinement lowers iterations while dragging/holding, then debounces a full-quality render (~200 ms) after interaction ends.
- Click-and-hold zoom only starts after a short delay and cancels as soon as a drag is detected.
- Palette changes update immediately; default debug mode is "None" so colors show as expected.

## Testing
Vitest covers core math (Mandelbrot iteration, viewport transforms, palettes), shader string integrity, and zoom logic. Run `npm test -- --run`.

## Troubleshooting
- Black canvas: check browser WebGL2 support (console errors). Ensure debug view is set to "None" for normal palettes.
- Slow interaction: lower "Quality" or enable "Reduce Quality While Dragging".
- Colors look flat: increase iterations or lower gamma (e.g., 0.8–1.2).

## References
- Vite React starter template (MIT): https://vitejs.dev/guide/
- Smooth coloring formula (continuous iteration count): Wikipedia, "Mandelbrot set" — https://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_(smooth)_coloring
- Viridis colormap values from matplotlib (CC0): https://github.com/matplotlib/matplotlib/blob/main/lib/matplotlib/_cm_listed.py
