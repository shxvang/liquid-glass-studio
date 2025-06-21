#version 300 es

precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

float chessboard(vec2 uv, float size) {
  float yBars = step(size * 2.0, mod(uv.y, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x, size * 4.0));
  return abs(yBars - xBars);
}

void main() {
  float chessboardBg = 1.0 - chessboard(gl_FragCoord.xy, 50.0) / 4.0;
  fragColor = vec4(vec3(chessboardBg), 1.0);
}
