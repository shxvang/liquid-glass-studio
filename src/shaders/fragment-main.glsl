#version 300 es

precision highp float;

in vec2 v_uv;
uniform sampler2D u_blurredBg;
uniform sampler2D u_bg;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
// uniform float u_time;
uniform float u_shapeWidth;
uniform float u_shapeHeight;
uniform float u_shapeRadius;
uniform float u_shapeRoundness;

out vec4 fragColor;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

vec3 sdSuperellipse(vec2 p, float r, float n) {
  p = p / r;
  vec2 gs = sign(p);
  vec2 ps = abs(p);
  float gm = pow(ps.x, n) + pow(ps.y, n);
  float gd = pow(gm, 1.0 / n) - 1.0;
  vec2 g = gs * pow(ps, vec2(n - 1.0)) * pow(gm, 1.0 / n - 1.0);
  p = abs(p);
  if (p.y > p.x) p = p.yx;
  n = 2.0 / n;
  float s = 1.0;
  float d = 1e20;
  const int num = 24;
  vec2 oq = vec2(1.0, 0.0);
  for (int i = 1; i < num; i++) {
    float h = float(i) / float(num - 1);
    vec2 q = vec2(pow(cos(h * 3.1415927 / 4.0), n), pow(sin(h * 3.1415927 / 4.0), n));
    vec2 pa = p - oq;
    vec2 ba = q - oq;
    vec2 z = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d2 = dot(z, z);
    if (d2 < d) {
      d = d2;
      s = pa.x * ba.y - pa.y * ba.x;
    }
    oq = q;
  }
  return vec3(sqrt(d) * sign(s) * r, g);
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

void main() {
  vec2 p1 = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
  vec2 p2 = (gl_FragCoord.xy - u_mouse) / u_resolution.y;
  float d1 = sdCircle(p1, 200.0 / u_resolution.y);
  // float d2 = sdSuperellipse(p2, 200.0 / u_resolution.y, 4.0).x;
  float d2 = roundedRectSDF(
    p2,
    vec2(0.0),
    u_shapeWidth / u_resolution.y,
    u_shapeHeight / u_resolution.y,
    u_shapeRadius / u_resolution.y,
    u_shapeRoundness
  );

  float merged = smin(d1, d2, 0.05);
  // float smoothed = smoothstep(0.0, 0.0005, merged);
  vec4 outColor;
  if (merged < 0.0) {
    // outColor = texture(u_blurredBg, v_uv);
    outColor = texture(u_blurredBg, v_uv);
  } else {
    outColor = texture(u_bg, v_uv);
  }

  fragColor = vec4(outColor.xyz, 1.0);
}
