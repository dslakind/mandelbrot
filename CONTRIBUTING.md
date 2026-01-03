# Contributing

Thank you for your interest in contributing to Mandelbrot Explorer!

## Setup

1. **Fork and clone**:
   ```bash
   git clone https://github.com/yourusername/mandelbrot.git
   cd mandelbrot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run dev server**:
   ```bash
   npm run dev
   ```

4. **Run tests in watch mode**:
   ```bash
   npm run test
   ```

## Code Quality

### Linting & Formatting

```bash
# Check for style issues
npm run lint

# TypeScript strict checks
npm run build  # Part of this is tsc
```

We use ESLint and Prettier. Consider installing editor extensions:
- **VS Code**: ESLint + Prettier - Code formatter

### Type Safety

- **Strict TypeScript**: All `tsconfig.json` flags enabled
- **No `any`**: Never use `any` unless documented with `// @ts-ignore` comment
- **Narrow types**: Use discriminated unions, type guards
- **Tests**: All core modules (in `src/core/`) must have >80% coverage

## Testing

### Unit Tests (Vitest)

Located in `tests/`:

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage

# UI mode
npm run test:ui
```

Write tests for:
- ✓ Core modules (`src/core/`) — comprehensive
- ✓ Store actions — happy paths
- ✗ React components (too expensive, use E2E instead)

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { pixelToComplex } from '../src/core/viewport';

describe('Viewport', () => {
  it('should map center pixel correctly', () => {
    const vp = /* ... */;
    const result = pixelToComplex(vp, 400, 225, 800, 450);
    expect(result.re).toBeCloseTo(vp.centerRe, 1);
  });
});
```

### E2E Tests (Playwright) — Future

Tests will validate user workflows:
- Load app, canvas visible
- Zoom via rectangle selection
- Undo/Redo navigation
- Reset button
- Export to PNG

These tests are **not fragile** — they use semantic queries (button labels, landmarks) not pixel-perfect assertions.

## Adding a New Palette

Palettes are easy to extend:

1. **Edit `src/core/palette.ts`**:
   ```typescript
   const PALETTES: Record<string, PaletteDefinition> = {
     // ... existing ...
     mypalette: {
       name: 'My Beautiful Palette',
       colors: [
         [0.0, 0.0, 0.0],   // RGB [0..1]
         [0.5, 0.2, 0.8],
         [1.0, 1.0, 0.0],
       ],
     },
   };
   ```

2. **Test it**:
   ```typescript
   const palette = generatePalette('mypalette', 256);
   expect(palette.length).toBe(256 * 4); // RGBA
   ```

3. **Use it**:
   - The palette dropdown auto-populates from `getPaletteNames()`
   - No UI changes needed

## Project Structure

```
/src
  /core         ← Pure logic (no React)
  /renderer     ← WebGL2 rendering
  /state        ← Zustand store
  /ui           ← React components + CSS
  /workers      ← Web Workers (export future)
/tests          ← Vitest unit tests
/docs           ← Architecture, algorithm, UX
/.github
  /workflows    ← CI/CD (GitHub Actions)
```

## Making a Change

### Example: Add a new control to SidePanel

1. **Add to store** (`src/state/store.ts`):
   ```typescript
   renderSettings: {
     // ... existing ...
     myNewOption: false,
   },

   updateRenderSettings: (settings: Partial<RenderSettings>) => {
     set(state => ({
       renderSettings: { ...state.renderSettings, ...settings },
     }));
   },
   ```

2. **Update type** (`src/core/types.ts`):
   ```typescript
   export interface RenderSettings {
     // ... existing ...
     myNewOption: boolean;
   }
   ```

3. **Add UI** (`src/ui/components/SidePanel.tsx`):
   ```tsx
   <div className="control-group">
     <label>
       <input
         type="checkbox"
         checked={settings.myNewOption}
         onChange={(e) =>
           updateRenderSettings({ myNewOption: e.target.checked })
         }
       />
       My New Option
     </label>
   </div>
   ```

4. **Test it**: `npm run test` (no tests required for simple UI toggles, but test any math)

5. **Lint & format**: `npm run lint`

## PR Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Run lint: `npm run lint`
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feat/my-feature`
7. Open a PR with description of changes

## Common Tasks

### Adjust iteration quality presets

Edit `src/renderer/renderController.ts`:
```typescript
static getQualityIterations(quality: 'low' | 'medium' | 'high' | 'ultra'): number {
  switch (quality) {
    case 'low':
      return 64;  // ← Change here
    // ... etc
  }
}
```

### Change default viewport

Edit `src/core/viewport.ts`:
```typescript
export function resetViewport(aspectRatio: number): Viewport {
  const width = 3.0; // ← Adjust default zoom width
  // ...
}
```

### Add a keyboard shortcut

Edit `src/ui/App.tsx`:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      undo();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Questions?

- Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module layout
- Check [docs/ALGORITHM.md](docs/ALGORITHM.md) for math details
- Open an issue for discussion

Thank you for contributing! 🎨
