/**
 * Palette generation and management for Mandelbrot coloring
 */

export interface PaletteDefinition {
  name: string;
  colors: [number, number, number][]; // RGB 0-1 values
}

/**
 * Generate a smooth palette from control points
 */
function interpolateColors(colors: [number, number, number][], steps: number): Uint8Array {
  const palette = new Uint8Array(steps * 4);
  const segmentSteps = Math.floor(steps / (colors.length - 1));

  let paletteIndex = 0;
  for (let i = 0; i < colors.length - 1; i++) {
    const c1 = colors[i];
    const c2 = colors[i + 1];

    for (let j = 0; j < segmentSteps && paletteIndex < steps; j++) {
      const t = j / segmentSteps;
      const r = Math.round((1 - t) * c1[0] * 255 + t * c2[0] * 255);
      const g = Math.round((1 - t) * c1[1] * 255 + t * c2[1] * 255);
      const b = Math.round((1 - t) * c1[2] * 255 + t * c2[2] * 255);

      palette[paletteIndex * 4] = r;
      palette[paletteIndex * 4 + 1] = g;
      palette[paletteIndex * 4 + 2] = b;
      palette[paletteIndex * 4 + 3] = 255;

      paletteIndex++;
    }
  }

  // Fill remaining with last color
  while (paletteIndex < steps) {
    const c = colors[colors.length - 1];
    palette[paletteIndex * 4] = Math.round(c[0] * 255);
    palette[paletteIndex * 4 + 1] = Math.round(c[1] * 255);
    palette[paletteIndex * 4 + 2] = Math.round(c[2] * 255);
    palette[paletteIndex * 4 + 3] = 255;
    paletteIndex++;
  }

  return palette;
}

/**
 * Apply gamma correction to a palette
 */
export function applyGamma(palette: Uint8Array, gamma: number): Uint8Array {
  const corrected = new Uint8Array(palette.length);
  const invGamma = 1 / gamma;

  for (let i = 0; i < palette.length; i += 4) {
    corrected[i] = Math.round(Math.pow(palette[i] / 255, invGamma) * 255);
    corrected[i + 1] = Math.round(Math.pow(palette[i + 1] / 255, invGamma) * 255);
    corrected[i + 2] = Math.round(Math.pow(palette[i + 2] / 255, invGamma) * 255);
    corrected[i + 3] = palette[i + 3];
  }

  return corrected;
}

/**
 * Predefined palettes
 */
const PALETTES: Record<string, PaletteDefinition> = {
  classic: {
    name: 'Classic HSV',
    colors: [
      [0, 0, 0],
      [0.25, 0, 1],
      [0.5, 1, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
  viridis: {
    name: 'Viridis',
    colors: [
      [0.267004, 0.004874, 0.329415],
      [0.282623, 0.140461, 0.469011],
      [0.253935, 0.265254, 0.529983],
      [0.206756, 0.371758, 0.553117],
      [0.163625, 0.471133, 0.558375],
      [0.127568, 0.566949, 0.550413],
      [0.134692, 0.658636, 0.517649],
      [0.266941, 0.748751, 0.440573],
      [0.477504, 0.821444, 0.318195],
      [0.741388, 0.873449, 0.149561],
      [0.993248, 0.906157, 0.143936],
    ],
  },
  inferno: {
    name: 'Inferno',
    colors: [
      [0.001462, 0.000466, 0.013866],
      [0.010196, 0.009137, 0.142864],
      [0.076352, 0.038648, 0.384014],
      [0.352091, 0.03501, 0.531975],
      [0.70164, 0.278969, 0.23471],
      [0.941596, 0.973281, 0.131368],
    ],
  },
  ice: {
    name: 'Ice',
    colors: [
      [0, 0, 0],
      [0, 0.5, 1],
      [0.5, 0.8, 1],
      [1, 1, 1],
    ],
  },
  sunset: {
    name: 'Sunset',
    colors: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0.5, 0],
      [1, 1, 0],
      [1, 1, 0.5],
    ],
  },
};

/**
 * Get all available palette names
 */
export function getPaletteNames(): string[] {
  return Object.keys(PALETTES);
}

/**
 * Generate a palette by name
 */
export function generatePalette(name: string, steps: number = 256, gamma: number = 1.0): Uint8Array {
  const def = PALETTES[name] || PALETTES['classic'];
  let palette = interpolateColors(def.colors, steps);

  if (gamma !== 1.0) {
    palette = applyGamma(palette, gamma);
  }

  return palette;
}

/**
 * Sample a color from a palette (0..1 -> RGBA)
 */
export function samplePalette(palette: Uint8Array, t: number): [number, number, number, number] {
  const steps = palette.length / 4;
  const clamped = Math.max(0, Math.min(1, t));
  const index = Math.floor(clamped * (steps - 1)) * 4;

  return [
    palette[index] / 255,
    palette[index + 1] / 255,
    palette[index + 2] / 255,
    palette[index + 3] / 255,
  ];
}

/**
 * Add a custom palette
 */
export function addPalette(name: string, colors: [number, number, number][]): void {
  PALETTES[name] = { name, colors };
}
