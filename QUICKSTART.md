# Quick Start Guide

## Prerequisites
- Node.js 18.19.1+ (fully compatible with Vite 5.4.x)
- npm 9+

## Installation
```bash
cd /home/dlakind/mandelbrot
npm install
```

## Development
```bash
# Start dev server
npm run dev
# Open http://localhost:5173
```

## Testing
```bash
# Run unit tests (watch mode)
npm test

# Run tests once
npm test -- --run

# UI test dashboard
npm run test:ui

# With coverage
npm test -- --coverage
```

## Building
```bash
# Production build
npm run build

# Output: dist/

# Preview build locally
npm run preview
```

## Linting
```bash
npm run lint
```

## Project Structure
```
/src
  /core/          Core math modules (100% testable)
    - types.ts
    - viewport.ts
    - mandelbrot.ts
    - palette.ts
  /renderer/      GPU rendering pipeline
    /webgl/
      - shaders.ts
      - renderer.ts
    - renderController.ts
  /state/         State management
    - store.ts
  /ui/            React components
    /components/
      - TopBar.tsx
      - SidePanel.tsx
      - CanvasView.tsx
      - StatusBar.tsx
    - App.tsx

/tests/           Unit tests (31 passing)
/docs/            Architecture & guides
/.github/workflows CI/CD
```

## Key Commands at a Glance

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm test -- --run` | Run tests once |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |
| `npm run test:ui` | Open Vitest UI |

## Test Results
```
 ✓ tests/mandelbrot.test.ts (9 tests)
 ✓ tests/viewport.test.ts (11 tests)
 ✓ tests/palette.test.ts (11 tests)
 
 Test Files  3 passed (3)
      Tests  31 passed (31)
```

## Build Output
```
dist/index.html              0.46 kB
dist/assets/index-*.css      7.22 kB (gzip: 2.03 kB)
dist/assets/index-*.js     213.21 kB (gzip: 66.89 kB)
```

## Documentation
- **README.md** - Features overview, setup, stack info
- **docs/ARCHITECTURE.md** - Module breakdown, data flow, lifecycle
- **docs/ALGORITHM.md** - Mandelbrot math, smooth coloring, mapping
- **docs/UX.md** - Interaction model, design philosophy
- **CONTRIBUTING.md** - Dev guidelines, adding features

## Next Steps
1. Review docs/ARCHITECTURE.md for codebase overview
2. Run tests to verify everything works
3. Start dev server to interact with the app
4. Check CONTRIBUTING.md for development guidelines
