export function createShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    console.warn('[createShader]:', 'Unable to create shader.');
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (status) {
    return shader;
  }

  console.warn(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);

  return null;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (status) {
    return program;
  }

  console.warn(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);

  return null;
}
