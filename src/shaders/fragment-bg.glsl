#version 300 es

precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_mergeRate;
uniform float u_shapeWidth;
uniform float u_shapeHeight;
uniform float u_shapeRadius;
uniform float u_shapeRoundness;

float chessboard(vec2 uv, float size) {
  float yBars = step(size * 2.0, mod(uv.y, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x, size * 4.0));
  // return abs(yBars - xBars);

  return yBars;
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float superellipseCornerSDF(vec2 p, float r, float n) {
  p = abs(p);
  float v = pow(pow(p.x, n) + pow(p.y, n), 1.0 / n);
  return v - r;
}

float roundedRectSDF(vec2 p, vec2 center, float width, float height, float cornerRadius, float n) {
  // 移动到中心坐标系
  p -= center;

  float cr = cornerRadius * 2.0;

  // 计算到矩形边缘的距离
  vec2 d = abs(p) - vec2(width * 2.0, height * 2.0) * 0.5;

  // 对于边缘区域和角落，我们需要不同的处理
  float dist;

  if (d.x > -cr && d.y > -cr) {
    // 角落区域
    vec2 cornerCenter = sign(p) * (vec2(width * 2.0, height * 2.0) * 0.5 - vec2(cr));
    vec2 cornerP = p - cornerCenter;
    dist = superellipseCornerSDF(cornerP, cr, n);
  } else {
    // 内部和边缘区域
    dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }

  return dist;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float mainSDF(vec2 p1, vec2 p2, vec2 p) {
  vec2 p1n = p1 + p / u_resolution.y;
  vec2 p2n = p2 + p / u_resolution.y;
  float d1 = sdCircle(p1n, 200.0 / u_resolution.y);
  // float d2 = sdSuperellipse(p2, 200.0 / u_resolution.y, 4.0).x;
  float d2 = roundedRectSDF(
    p2n,
    vec2(0.0),
    u_shapeWidth / u_resolution.y,
    u_shapeHeight / u_resolution.y,
    u_shapeRadius / u_resolution.y,
    u_shapeRoundness
  );

  return smin(d1, d2, u_mergeRate);
}

void main() {
  // float chessboardBg = chessboard(gl_FragCoord.xy, 14.0);
  float chessboardBg = 1.0 - chessboard(gl_FragCoord.xy, 10.0) / 4.0;

  // draw shadow
  // center of shape 1
  vec2 p1 = (vec2(0, 0) - u_resolution.xy * 0.5) / u_resolution.y;
  // center of shape 2
  vec2 p2 = (vec2(0, 0) - u_mouse) / u_resolution.y;
  // merged shape
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);

  float shadow = merged;

  fragColor = vec4(vec3(chessboardBg), 1.0);
}
