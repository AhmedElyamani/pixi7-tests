// Jest setup file for PIXI.js testing
import 'jest-canvas-mock';

// Mock HTMLCanvasElement methods that PIXI.js might use
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Array(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock WebGL context for PIXI.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn((contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        drawArrays: jest.fn(),
        drawElements: jest.fn(),
        viewport: jest.fn(),
        clearColor: jest.fn(),
        clear: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        getShaderParameter: jest.fn(),
        getShaderInfoLog: jest.fn(),
        getProgramParameter: jest.fn(),
        getProgramInfoLog: jest.fn(),
        deleteShader: jest.fn(),
        deleteProgram: jest.fn(),
        deleteBuffer: jest.fn(),
        deleteTexture: jest.fn(),
        getUniformLocation: jest.fn(),
        getAttribLocation: jest.fn(),
        uniform1f: jest.fn(),
        uniform2f: jest.fn(),
        uniform3f: jest.fn(),
        uniform4f: jest.fn(),
        uniformMatrix4fv: jest.fn(),
        vertexAttribPointer: jest.fn(),
        enableVertexAttribArray: jest.fn(),
      };
    }
    return null;
  }),
});

// Global test utilities
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};