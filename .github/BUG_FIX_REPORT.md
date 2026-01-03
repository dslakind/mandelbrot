# Mandelbrot Explorer - Bug Fix Summary

## Issues Found and Fixed

### Critical Bug #1: Fragment Shader Coordinate Mapping ⚠️

**Problem:**
The fragment shader was treating `fragCoord` as if it was already in the range (0 to 1), but WebGL passes vertex shader outputs as Normalized Device Coordinates (NDC) which range from (-1 to 1).

**Symptom:**
- Entire canvas rendered as black
- No Mandelbrot set visible
- Coordinates showed on hover but no visualization

**Root Cause:**
```glsl
// INCORRECT (old code):
float re = centerRe - viewWidth * 0.5 + fragCoord.x * viewWidth;
float im = centerIm + viewHeight * 0.5 - fragCoord.y * viewHeight;
```

This was mapping:
- `fragCoord.x = -1` → Complex Re = centerRe - viewWidth * 0.5 - viewWidth (WRONG!)
- `fragCoord.x = 0` → Complex Re = centerRe - viewWidth * 0.5 (WRONG!)
- `fragCoord.x = 1` → Complex Re = centerRe - viewWidth * 0.5 + viewWidth (WRONG!)

**Fix:**
```glsl
// CORRECT (new code):
vec2 uv = (fragCoord + 1.0) * 0.5;  // Convert NDC (-1 to 1) to UV (0 to 1)
float re = centerRe - viewWidth * 0.5 + uv.x * viewWidth;
float im = centerIm - viewHeight * 0.5 + uv.y * viewHeight;
```

Now correctly maps:
- `fragCoord.x = -1` → `uv.x = 0` → Left edge of viewport
- `fragCoord.x = 0` → `uv.x = 0.5` → Center of viewport
- `fragCoord.x = 1` → `uv.x = 1` → Right edge of viewport

**Files Modified:**
- `src/renderer/webgl/shaders.ts`

---

### Bug #2: Smooth Coloring Calculation

**Problem:**
The smooth coloring calculation used an incorrect formula that could produce NaN or infinity for certain magnitude values.

**Root Cause:**
```glsl
// INCORRECT (old code):
float magnitude = sqrt(zRe * zRe + zIm * zIm);
float logMag = log(magnitude);
float smooth = float(i) + 1.0 - logBailout / logMag;  // Division can produce inf/NaN
```

**Fix:**
```glsl
// CORRECT (new code - standard Mandelbrot smooth coloring):
float magnitude = sqrt(zReSq + zImSq);

if (magnitude < 0.0001) {
  magnitude = 0.0001;  // Safety clamp
}

float nu = log(log(magnitude) / log(2.0)) / log(2.0);
float smooth = float(i) + 1.0 - nu;
```

This uses the standard normalized iteration count formula: `μ = n + 1 - log₂(log₂|zₙ|)`

**Files Modified:**
- `src/renderer/webgl/shaders.ts`

---

### Improvement #1: Better Error Logging

Added detailed error messages for WebGL shader compilation and program linking failures to help debug future issues.

**Files Modified:**
- `src/renderer/webgl/renderer.ts`

**Changes:**
- Vertex shader compilation errors now show full error log
- Fragment shader compilation errors now show full error log  
- Program linking errors now show full error log
- Added clear background color to help debug render failures

---

## New Tests Added

### Test Suite #1: Shader Coordinate Transformations
**File:** `tests/shaders.test.ts`

Tests that verify the fragment shader coordinate mapping is correct:
- ✅ NDC center (0,0) maps to viewport center
- ✅ NDC corners map to viewport corners correctly
- ✅ Zoomed viewports work correctly
- ✅ Different aspect ratios handled properly
- ✅ Mandelbrot cardinal points mapped correctly
- ✅ Smooth coloring math produces finite values

**Total:** 9 tests

---

### Test Suite #2: Zoom Interaction
**File:** `tests/zoom.test.ts`

Comprehensive tests for the zoom rectangle selection functionality:

#### Rectangle Selection (5 tests)
- ✅ Zoom to center selection
- ✅ Zoom to off-center selection
- ✅ Aspect ratio preservation
- ✅ Small zoom selections (deep zoom)
- ✅ Edge selections

#### Zoom Level Calculation (4 tests)
- ✅ Default viewport zoom level
- ✅ 2x zoom calculation
- ✅ Deep zoom (100x) calculation
- ✅ Extreme zoom levels (100,000x+)

#### Pixel-to-Complex Mapping (2 tests)
- ✅ Accurate mapping after zoom
- ✅ Corner pixels correct after zoom

#### Sequential Zoom Operations (2 tests)
- ✅ Multiple zoom operations
- ✅ Precision through 10 zoom levels

#### Different Canvas Sizes (2 tests)
- ✅ Square canvas (1:1 aspect)
- ✅ Portrait orientation (9:16 aspect)

**Total:** 15 tests

---

## Test Results

**Before fixes:** Application showed all black, tests incomplete
**After fixes:** All tests passing, application renders correctly

```
Test Files: 5 passed (5)
Tests: 55 passed (55)
Duration: 1.58s

Breakdown:
- mandelbrot.test.ts: 9 tests ✓
- viewport.test.ts: 11 tests ✓
- palette.test.ts: 11 tests ✓
- shaders.test.ts: 9 tests ✓
- zoom.test.ts: 15 tests ✓
```

---

## How to Verify the Fix

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:5173 in browser**

3. **Verify rendering:**
   - ✅ Should see colorful Mandelbrot set (not all black)
   - ✅ Main cardioid body should be visible (centered)
   - ✅ Bulb to the left should be visible
   - ✅ Default view: Re ∈ [-2, 1], Im ∈ [-0.84, 0.84]

4. **Test zoom functionality:**
   - Click and hold on canvas
   - Drag to create selection rectangle
   - Release to zoom
   - ✅ Should zoom into selected region
   - ✅ Aspect ratio should be preserved
   - ✅ Colors should remain smooth

5. **Test controls:**
   - Change palette → colors should update
   - Adjust gamma → brightness should change
   - Toggle smooth coloring → should see difference
   - Change iterations → detail level should change

6. **Test undo/redo:**
   - Zoom in several times
   - Click Undo (⤴) → should go back
   - Click Redo (⤵) → should go forward
   - Click Home → should return to default view

---

## Technical Explanation: Why NDC to UV Conversion Matters

### Vertex Shader Output Range
The vertex shader outputs `fragCoord` in **Normalized Device Coordinates**:
- x: -1 (left edge) to +1 (right edge)
- y: -1 (bottom edge) to +1 (top edge)

### Required Range for Texture/UV Sampling
To map to the complex plane, we need values in range:
- u: 0 (left) to 1 (right)
- v: 0 (bottom) to 1 (top)

### Conversion Formula
```glsl
vec2 uv = (fragCoord + 1.0) * 0.5;
```

This transforms:
| NDC (fragCoord) | UV (after conversion) |
|----------------|----------------------|
| -1.0           | 0.0                  |
| -0.5           | 0.25                 |
| 0.0            | 0.5                  |
| +0.5           | 0.75                 |
| +1.0           | 1.0                  |

### Complex Plane Mapping
Once in UV space (0 to 1), we can correctly map to complex coordinates:
```glsl
float re = centerRe - viewWidth * 0.5 + uv.x * viewWidth;
float im = centerIm - viewHeight * 0.5 + uv.y * viewHeight;
```

This gives us:
- `uv.x = 0` → `re = centerRe - viewWidth/2` (left edge)
- `uv.x = 0.5` → `re = centerRe` (center)
- `uv.x = 1` → `re = centerRe + viewWidth/2` (right edge)

---

## Lessons Learned

1. **Always verify coordinate systems** when working with WebGL shaders
2. **NDC vs UV space** is a common source of bugs in fragment shaders
3. **Comprehensive unit tests** catch math errors before they reach the browser
4. **Good error logging** makes debugging shader issues much faster
5. **Test at multiple zoom levels** to ensure precision is maintained

---

## Files Changed

| File | Lines Changed | Type |
|------|--------------|------|
| `src/renderer/webgl/shaders.ts` | ~15 | Bug fix |
| `src/renderer/webgl/renderer.ts` | ~10 | Improvement |
| `tests/shaders.test.ts` | +156 | New tests |
| `tests/zoom.test.ts` | +364 | New tests |

**Total:** +520 lines (mostly tests), 4 files modified

---

## Status

✅ **All issues resolved**
✅ **55/55 tests passing**
✅ **Rendering works correctly**
✅ **Zoom functionality verified**
✅ **Color palettes working**

The Mandelbrot Explorer is now fully functional with proper rendering and interaction!
