#version 300 es

precision highp float;

in vec2 v_uv;
uniform sampler2D u_blurredBg;
uniform sampler2D u_bg;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
// uniform float u_time;
uniform float u_mergeRate;
uniform float u_shapeWidth;
uniform float u_shapeHeight;
uniform float u_shapeRadius;
uniform float u_shapeRoundness;
uniform vec4 u_tint;

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

vec2 getNormal(vec2 p1, vec2 p2, vec2 p) {
  // 使用场景尺度自适应的 eps
  vec2 h = vec2(max(abs(dFdx(p.x)), 0.0001), max(abs(dFdy(p.y)), 0.0001));

  vec2 grad =
    vec2(
      mainSDF(p1, p2, p + vec2(h.x, 0.0)) - mainSDF(p1, p2, p - vec2(h.x, 0.0)),
      mainSDF(p1, p2, p + vec2(0.0, h.y)) - mainSDF(p1, p2, p - vec2(0.0, h.y))
    ) /
    (2.0 * h);

  return normalize(grad);
}

void main() {
  vec2 p1 = (vec2(0, 0) - u_resolution.xy * 0.5) / u_resolution.y;
  vec2 p2 = (vec2(0, 0) - u_mouse) / u_resolution.y;
  // float d1 = sdCircle(p1, 200.0 / u_resolution.y);
  // float d2 = roundedRectSDF(
  //   p2,
  //   vec2(0.0),
  //   u_shapeWidth / u_resolution.y,
  //   u_shapeHeight / u_resolution.y,
  //   u_shapeRadius / u_resolution.y,
  //   u_shapeRoundness
  // );

  float merged = mainSDF(p1, p2, gl_FragCoord.xy);

  float normalizedInside = merged / u_shapeHeight / u_resolution.y + 1.0;
  float edgeBlendFactor = pow(normalizedInside, 12.0);
  // float smoothed = smoothstep(0.0, 0.0005, merged);
  vec4 outColor;
  if (merged < 0.0) {
    // outColor = texture(u_blurredBg, v_uv);
    // outColor = texture(u_blurredBg, v_uv);

    // float px = 2.0 / u_resolution.y;
    // vec3 col = merged > 0.0 ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    // // 阴影
    // col *= 1.0 - exp(-0.03 * abs(merged) * u_resolution.y);
    // // 等高线
    // col *= 0.6 + 0.4 * smoothstep(-0.5, 0.5, cos(0.25 * abs(merged) * u_resolution.y));
    // // 外层白框
    // col = mix(col, vec3(1.0), 1.0 - smoothstep(0.003 - px, 0.003 + px, abs(merged)));

    float edgeEffect = clamp(1.0 + merged * 0.03 * u_resolution.y, 0.0, 1.0);

    if (edgeEffect > 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      float normalSize = length(normal);
      vec3 color = vec3((normal * 0.5 + 0.5) * edgeEffect, 0.0);
      outColor = vec4(color, 1.0);

      // outColor.r = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.6).r;
      // outColor.g = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.4).g;
      // outColor.b = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.8).b;
      outColor = texture(u_blurredBg, v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0);
    } else {
      outColor = texture(u_blurredBg, v_uv);
    }

    outColor = mix(outColor, vec4(u_tint.r, u_tint.g, u_tint.b, u_tint.a * 0.5), u_tint.a * 0.2);

    // outColor = vec4(mix(texture(u_blurredBg, v_uv).rgb, vec3(1.0), edgeEffect), 1.0);

  } else {
    outColor = texture(u_bg, v_uv);
  }

  fragColor = vec4(outColor.xyz, 1.0);
}
