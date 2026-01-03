/**
 * WebGL2 shaders for Mandelbrot rendering
 */

export const VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 position;
out vec2 fragCoord;

void main() {
  fragCoord = position;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float centerRe;
uniform float centerIm;
uniform float viewWidth;
uniform float viewHeight;
uniform int maxIterations;
uniform bool smoothColoring;
uniform float gamma;
uniform vec3 insideColor;
uniform sampler2D paletteSampler;
uniform bool debugGradient;
uniform bool debugGrayscale;

in vec2 fragCoord;
out vec4 outColor;

const float bailout = 4.0;

void main() {
  // Convert fragment coordinates from NDC (-1 to 1) to (0 to 1)
  vec2 uv = (fragCoord + 1.0) * 0.5;

  // Debug gradient passthrough
  if (debugGradient) {
    outColor = vec4(uv, 0.0, 1.0);
    return;
  }

  // Convert to complex plane coordinates
  float re = centerRe - viewWidth * 0.5 + uv.x * viewWidth;
  float im = centerIm - viewHeight * 0.5 + uv.y * viewHeight;

  // Mandelbrot iteration
  float zRe = 0.0;
  float zIm = 0.0;
  int i = 0;

  for (i = 0; i < maxIterations; i++) {
    float zReSq = zRe * zRe;
    float zImSq = zIm * zIm;
    float magnitudeSq = zReSq + zImSq;

    if (magnitudeSq > bailout) {
      break;
    }

    float temp = zReSq - zImSq + re; // z_re^2 - z_im^2 + c_re
    zIm = 2.0 * zRe * zIm + im;      // 2*z_re*z_im + c_im
    zRe = temp;                      // z = z^2 + c
  }

  vec4 color;

  if (i == maxIterations) {
    // Inside the set
    color = vec4(insideColor, 1.0);
  } else {
    // Outside the set
    float t;

    if (smoothColoring) {
      // Smooth coloring using continuous iteration count
      float zReSq = zRe * zRe;
      float zImSq = zIm * zIm;
      float magnitude = sqrt(zReSq + zImSq);

      // Ensure magnitude is >= 1 to keep log arguments positive
      magnitude = max(magnitude, 1.0000001);

      float nu = log2(log2(magnitude));
      float smoothIter = float(i) + 1.0 - nu;
      t = smoothIter / float(maxIterations);
    } else {
      // Discrete coloring
      t = float(i) / float(maxIterations);
    }

    // Clamp to valid texture coordinates
    t = clamp(t, 0.0, 1.0);

    if (debugGrayscale) {
      color = vec4(vec3(t), 1.0);
    } else {
      // Sample palette
      color = texture(paletteSampler, vec2(t, 0.5));

      // Apply gamma correction
      color.rgb = pow(color.rgb, vec3(1.0 / gamma));
    }
  }

  outColor = color;
}
`;
