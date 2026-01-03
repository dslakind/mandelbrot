/**
 * Mandelbrot set computation (CPU reference implementation)
 */

/**
 * Compute escape iterations for a complex number
 * Returns maxIterations if the point is inside the set (doesn't escape)
 */
export function escapeIterations(cRe: number, cIm: number, maxIterations: number): number {
  let zRe = 0;
  let zIm = 0;
  let i = 0;

  const bailout = 4; // |z|^2 > bailout means escaped
  const bailoutSq = bailout;

  while (i < maxIterations) {
    const zReSq = zRe * zRe;
    const zImSq = zIm * zIm;
    const magnitudeSq = zReSq + zImSq;

    if (magnitudeSq > bailoutSq) {
      return i;
    }

    const temp = zReSq - zImSq + cRe;
    zIm = 2 * zRe * zIm + cIm;
    zRe = temp;

    i++;
  }

  return maxIterations;
}

/**
 * Compute smooth escape time using continuous iteration count
 * Returns a value in [0, maxIterations] that varies smoothly
 */
export function smoothEscape(cRe: number, cIm: number, maxIterations: number): number {
  let zRe = 0;
  let zIm = 0;
  let i = 0;

  const bailout = 4;
  const bailoutSq = bailout;
  const logBailout = Math.log(bailout);

  while (i < maxIterations) {
    const zReSq = zRe * zRe;
    const zImSq = zIm * zIm;
    const magnitudeSq = zReSq + zImSq;

    if (magnitudeSq > bailoutSq) {
      // Smooth coloring using logarithmic interpolation
      const magnitude = Math.sqrt(magnitudeSq);
      const logMag = Math.log(magnitude);
      const smooth = i + 1 - logBailout / logMag;
      return Math.min(smooth, maxIterations);
    }

    const temp = zReSq - zImSq + cRe;
    zIm = 2 * zRe * zIm + cIm;
    zRe = temp;

    i++;
  }

  return maxIterations;
}

/**
 * Batch compute iterations for a grid of points
 * Useful for progressive refinement
 */
export function batchIterations(
  points: Array<{ re: number; im: number }>,
  maxIterations: number,
  smooth: boolean = false
): number[] {
  const compute = smooth ? smoothEscape : escapeIterations;
  return points.map(p => compute(p.re, p.im, maxIterations));
}
