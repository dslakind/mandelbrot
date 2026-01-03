# Algorithm Details

## Escape-Time Algorithm

The Mandelbrot Set is the set of complex numbers **c** for which the iterative function:

$$z_0 = 0$$
$$z_{n+1} = z_n^2 + c$$

does not diverge (remains bounded).

### Bailout Condition

In practice, we use a **bailout threshold** $|z| > 2$ (equivalently, $|z|^2 > 4$). If this is exceeded, the point is guaranteed to diverge to infinity.

### Iteration Counting

For each pixel (complex coordinate **c**):

```typescript
let z = 0 + 0i;
let i = 0;

while (i < maxIterations && |z|² < 4) {
  z = z² + c;
  i++;
}

// Color based on i (iteration count at escape, or maxIterations if inside)
```

Points inside the set (`i == maxIterations`) are typically colored black or a custom color. Points outside are colored based on escape iteration.

## Smooth Coloring

Discrete iteration bands create visible artifacts ("banding"). Smooth coloring interpolates between bands using the magnitude of **z** at escape.

### Continuous Iteration Count

When escape is detected at iteration **i**, the magnitude of **z** is typically in the range [2, ~∞). We estimate a fractional iteration using the standard smooth coloring form (matching the fragment shader):

$$\text{smooth} = i + 1 - \log_2(\log_2(|z|))$$

This approximates the fractional iteration needed to exceed the bailout threshold, producing smooth color gradients without banding.

### Implementation

In the CPU reference:
```typescript
export function smoothEscape(cRe: number, cIm: number, maxIterations: number): number {
  let zRe = 0, zIm = 0;
  let i = 0;
  const logBailout = Math.log(4); // log(bailout)

  while (i < maxIterations) {
    const magnitudeSq = zRe² + zIm²;
    if (magnitudeSq > 4) {
      const magnitude = Math.sqrt(magnitudeSq);
      const logMag = Math.log(magnitude);
      return i + 1 - logBailout / logMag; // Equivalent to log2(log2(|z|)) form
    }
    // z = z² + c
    const temp = zRe² - zIm² + cRe;
    zIm = 2 * zRe * zIm + cIm;
    zRe = temp;
    i++;
  }

  return maxIterations;
}
```

In the GPU shader:
```glsl
if (magnitudeSq > bailout) {
  float magnitude = sqrt(magnitudeSq);
  float logMag = log(magnitude);
  float smooth = float(i) + 1.0 - logBailout / logMag;
  t = mod(smooth, float(maxIterations)) / float(maxIterations); // [0..1]
}
```

The value is normalized to [0..1] for palette lookup.

## Complex Plane Mapping

The viewport is defined by:
- **Center**: (centerRe, centerIm)
- **Dimensions**: (width, height) in the complex plane

For a pixel at position `(px, py)` on an (width × height) canvas:

$$\text{re} = \text{centerRe} - \frac{\text{width}}{2} + \text{px} \cdot \frac{\text{width}}{\text{canvasWidth}}$$

$$\text{im} = \text{centerIm} + \frac{\text{height}}{2} - \text{py} \cdot \frac{\text{height}}{\text{canvasHeight}}$$

Note: The y-axis is flipped because canvas coordinates have y increasing downward, but complex plane imaginary axis increases upward.

## Zoom Selection

When user drags a rectangle from (x1, y1) to (x2, y2):

1. **Adjust for aspect ratio**: The selection rectangle must match the canvas aspect ratio. We adjust width or height:
   ```typescript
   const pixelAspect = rectWidth / rectHeight;
   const canvasAspect = canvasWidth / canvasHeight;
   
   if (pixelAspect > canvasAspect) {
     // Selection is wider than canvas; reduce width
     newHeight = rectHeight;
     newWidth = newHeight * canvasAspect;
   } else {
     // Selection is taller; reduce height
     newWidth = rectWidth;
     newHeight = newWidth / canvasAspect;
   }
   ```

2. **Calculate center**: Center of the adjusted rectangle in pixel space:
   ```typescript
   centerPixelX = rectX + rectWidth / 2;
   centerPixelY = rectY + rectHeight / 2;
   complex = pixelToComplex(viewport, centerPixelX, centerPixelY, ...);
   ```

3. **Calculate new viewport dimensions**:
   ```typescript
   newWidth = (rectWidth / canvasWidth) * viewport.width;
   newHeight = newWidth / canvasAspect; // Maintain aspect ratio
   ```

4. **Create new viewport**: centered at the complex center with the new dimensions.

## Color Palette

A 1D texture (1D × 256 RGBA) is generated offline and uploaded to GPU.

### Palette Generation

Control points define a smooth interpolation:
```typescript
const viridis = [
  [0.267, 0.005, 0.329],  // Dark purple
  [0.283, 0.140, 0.469],  // Purple
  [0.254, 0.265, 0.530],  // Blue
  ...
  [0.993, 0.906, 0.144],  // Yellow
];

function interpolateColors(colors, steps) {
  // For each segment between control points, interpolate smoothly
  // Return Uint8Array of RGBA pixels
}
```

### Gamma Correction

Gamma curves adjust perceived brightness:

$$C_{\text{corrected}} = C^{1/\gamma}$$

Higher gamma (e.g., 2.2) brightens the image; lower (e.g., 0.5) darkens.

Applied in shader:
```glsl
color.rgb = pow(color.rgb, vec3(1.0 / gamma));
```

## Built-in Palettes

1. **Classic**: Simple HSV-inspired band colors (purple → cyan → yellow → red)
2. **Viridis**: Scientific colormap, perceptually uniform (dark purple → green → yellow)
3. **Inferno**: High-contrast (black → deep purple → orange → yellow)
4. **Ice**: Cool tones (black → cyan → white)
5. **Sunset**: Warm tones (black → red → orange → yellow)

Users can add custom palettes via `addPalette(name, colorArray)`.

## Performance Notes

- **GPU Computation**: Fragment shader runs in parallel on thousands of fragments
- **Iteration Limit**: Higher iterations = slower render, more detail
- **Progressive Refinement**: During dragging, use fewer iterations for responsiveness
- **Texture Sampling**: Palette lookup is a single `texture()` call per fragment

Typical framerate: 60 FPS for 256 iterations at 1080p, drops to 15-30 FPS at 2048 iterations (Ultra quality).

## References
- Smooth coloring (continuous iteration count): Wikipedia, "Mandelbrot set" — https://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_(smooth)_coloring
- Viridis colormap control points: matplotlib (CC0) — https://github.com/matplotlib/matplotlib/blob/main/lib/matplotlib/_cm_listed.py
