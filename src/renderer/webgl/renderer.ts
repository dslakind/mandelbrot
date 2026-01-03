/**
 * WebGL2 renderer for Mandelbrot set
 */

import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import { generatePalette } from '../../core/palette';
import type { Viewport, RenderSettings, RenderStats } from '../../core/types';

interface WebGL2RendererConfig {
  canvas: HTMLCanvasElement;
  onStatsUpdate?: (stats: RenderStats) => void;
}

export class WebGL2Renderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private paletteTexture!: WebGLTexture;
  private renderStartTime: number = 0;
  private onStatsUpdate?: (stats: RenderStats) => void;

  constructor(config: WebGL2RendererConfig) {
    this.canvas = config.canvas;
    this.onStatsUpdate = config.onStatsUpdate;

    const gl = this.canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    this.setupProgram();
    this.setupGeometry();
    this.setupPalette('viridis');
  }

  private checkError(stage: string): void {
    const err = this.gl.getError();
    if (err !== this.gl.NO_ERROR) {
      console.error(`WebGL error at ${stage}:`, err);
    }
  }

  private setupProgram(): void {
    const gl = this.gl;

    // Compile vertex shader
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    console.log('Vertex shader info log:', gl.getShaderInfoLog(vs));
    this.checkError('vertex shader compile');

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vs);
      console.error('Vertex shader compilation error:', error);
      throw new Error(`Failed to compile vertex shader: ${error}`);
    }

    // Compile fragment shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    console.log('Fragment shader info log:', gl.getShaderInfoLog(fs));
    this.checkError('fragment shader compile');

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fs);
      console.error('Fragment shader compilation error:', error);
      throw new Error(`Failed to compile fragment shader: ${error}`);
    }

    // Link program
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    console.log('Program info log:', gl.getProgramInfoLog(program));
    this.checkError('program link');

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      console.error('Program linking error:', error);
      throw new Error(`Failed to link program: ${error}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.program = program;
  }

  private setupGeometry(): void {
    const gl = this.gl;

    // Create a full-screen quad
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1,
    ]);

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    this.vao = vao;
  }

  private setupPalette(paletteName: string): void {
    const gl = this.gl;

    // Generate palette
    const paletteData = generatePalette(paletteName, 256);

    // Create texture
    if (this.paletteTexture) {
      gl.deleteTexture(this.paletteTexture);
    }

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      256,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      paletteData
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.paletteTexture = texture;
  }

  updatePalette(paletteName: string): void {
    this.setupPalette(paletteName);
  }

  render(viewport: Viewport, settings: RenderSettings): void {
    const gl = this.gl;
    const dpr = window.devicePixelRatio || 1;
    const debugMode = settings.debugMode ?? 'none';


    // Update canvas size
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    const canvasWidth = Math.round(displayWidth * dpr);
    const canvasHeight = Math.round(displayHeight * dpr);
    

    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      gl.viewport(0, 0, canvasWidth, canvasHeight);
      this.checkError('viewport');
    }

    this.renderStartTime = performance.now();

    // Clear to help debug (should see this briefly if shader fails)
    gl.clearColor(0.1, 0.0, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use program
    gl.useProgram(this.program);

    // Set uniforms
    const centerReLoc = gl.getUniformLocation(this.program, 'centerRe');
    const centerImLoc = gl.getUniformLocation(this.program, 'centerIm');
    const viewWidthLoc = gl.getUniformLocation(this.program, 'viewWidth');
    const viewHeightLoc = gl.getUniformLocation(this.program, 'viewHeight');
    const maxIterationsLoc = gl.getUniformLocation(this.program, 'maxIterations');
    const smoothColoringLoc = gl.getUniformLocation(this.program, 'smoothColoring');
    const gammaLoc = gl.getUniformLocation(this.program, 'gamma');
    const insideColorLoc = gl.getUniformLocation(this.program, 'insideColor');
    const paletteLoc = gl.getUniformLocation(this.program, 'paletteSampler');
    const debugGradientLoc = gl.getUniformLocation(this.program, 'debugGradient');
    const debugGrayscaleLoc = gl.getUniformLocation(this.program, 'debugGrayscale');

    gl.uniform1f(centerReLoc, viewport.centerRe);
    gl.uniform1f(centerImLoc, viewport.centerIm);
    gl.uniform1f(viewWidthLoc, viewport.width);
    gl.uniform1f(viewHeightLoc, viewport.height);
    gl.uniform1i(maxIterationsLoc, settings.maxIterations);
    gl.uniform1i(smoothColoringLoc, settings.smoothColoring ? 1 : 0);
    gl.uniform1f(gammaLoc, settings.gamma);
    gl.uniform3fv(insideColorLoc, settings.insideColor);
    gl.uniform1i(debugGradientLoc, debugMode === 'gradient' ? 1 : 0);
    gl.uniform1i(debugGrayscaleLoc, debugMode === 'grayscale' ? 1 : 0);

    if (debugMode !== 'none') {
      console.log('Render uniforms', {
        canvasWidth,
        canvasHeight,
        dpr,
        viewport,
        maxIterations: settings.maxIterations,
        gamma: settings.gamma,
        debugMode,
      });
    }
    

    // Bind palette texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
    gl.uniform1i(paletteLoc, 0);

    // Render
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
      // Check for WebGL errors
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('WebGL error after draw:', error);
      }

    const renderTime = performance.now() - this.renderStartTime;

    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        iterationCount: settings.maxIterations,
        renderTime: Math.round(renderTime),
        frameTime: Math.round(renderTime),
      });
    }
  }

  resize(): void {
    // The render() method will handle resizing
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.paletteTexture);
  }
}
