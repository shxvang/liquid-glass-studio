#version 300 es

precision highp float;

#define STEP (6.0)
const float N_R = 1.02;
const float N_G = 1.04;
const float N_B = 1.06;

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
uniform float u_refThickness;
uniform float u_refFactor;
uniform float u_refDispersion;
uniform float u_refFresnelRange;
uniform float u_refFresnelFactor;

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

  // return normalize(grad);
  return grad * 1.414213562 * 1000.0;
}

vec2 getNormal2(vec2 p1, vec2 p2, vec2 p) {
  float eps = 0.7071 * 0.0005; // ~1/sqrt(2) * epsilon
  vec2 e1 = vec2(1.0, 1.0);
  vec2 e2 = vec2(-1.0, 1.0);
  vec2 e3 = vec2(1.0, -1.0);
  vec2 e4 = vec2(-1.0, -1.0);

  return normalize(
    e1 * mainSDF(p1, p2, p + eps * e1) +
      e2 * mainSDF(p1, p2, p + eps * e2) +
      e3 * mainSDF(p1, p2, p + eps * e3) +
      e4 * mainSDF(p1, p2, p + eps * e4)
  );
}

vec2 getNormal3(vec2 p1, vec2 p2, vec2 p) {
  float eps = 0.0005;
  vec2 e = vec2(eps, 0.0);

  float dx = mainSDF(p1, p2, p + e.xy) - mainSDF(p1, p2, p - e.xy); // ∂f/∂x
  float dy = mainSDF(p1, p2, p + e.yx) - mainSDF(p1, p2, p - e.yx); // ∂f/∂y

  return normalize(vec2(dx, dy));
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 vec2ToColor(vec2 v) {
  float angle = atan(v.y, v.x);
  if (angle < 0.0) angle += 2.0 * 3.1415926;
  float hue = angle / (2.0 * 3.1415926);
  vec3 hsv = vec3(hue, 1.0, 1.0);
  return hsv2rgb(hsv);
}

vec4 getTextureDispersion(sampler2D tex, vec2 offset, float factor) {
  vec4 pixel = vec4(1.0);
  pixel.r = texture(tex, v_uv + offset * (1.0 + (N_R - 1.0) * factor)).r;
  pixel.g = texture(tex, v_uv + offset * (1.0 + (N_G - 1.0) * factor)).g;
  pixel.b = texture(tex, v_uv + offset * (1.0 + (N_B - 1.0) * factor)).b;

  return pixel;
}

void main() {
  // center of shape 1
  vec2 p1 = (vec2(0, 0) - u_resolution.xy * 0.5) / u_resolution.y;
  // center of shape 2
  vec2 p2 = (vec2(0, 0) - u_mouse) / u_resolution.y;
  // merged shape
  float merged = mainSDF(p1, p2, gl_FragCoord.xy);

  vec4 outColor;
  // step 0: sdfs
  if (STEP <= 0.0) {
    float px = 2.0 / u_resolution.y;
    vec3 col = merged > 0.0 ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    // 阴影
    col *= 1.0 - exp(-0.03 * abs(merged) * u_resolution.y);
    // 等高线
    col *= 0.6 + 0.4 * smoothstep(-0.5, 0.5, cos(0.25 * abs(merged) * u_resolution.y));
    // 外层白框
    col = mix(
      col,
      vec3(1.0),
      1.0 - smoothstep(3.0 / u_resolution.y - px, 3.0 / u_resolution.y + px, abs(merged))
    );
    outColor = vec4(col, 1.0);
    // step 1: normals
  } else if (STEP <= 1.0) {
    if (merged < 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      vec3 normalColor = vec2ToColor(normal);

      outColor = vec4(normalColor, 1.0);
    } else {
      outColor = texture(u_bg, v_uv);
    }
    // step2: edge factors
  } else if (STEP <= 2.0) {
    if (merged < 0.0) {
      float nmerged = -10.0 * (merged * u_resolution.y) / 4000.0;
      float thickness = u_refThickness / 100.0;
      float edgeFactor = 0.0;
      if (nmerged < thickness) {
        edgeFactor = pow(1.0 - nmerged / thickness, 2.0);
      }

      outColor = vec4(vec3(edgeFactor), 1.0);
    } else {
      outColor = texture(u_bg, v_uv);
    }
    // step3: edge factor with normal
  } else if (STEP <= 3.0) {
    if (merged < 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      vec3 normalColor = vec2ToColor(normal);
      float nmerged = -10.0 * (merged * u_resolution.y) / 4000.0;
      float thickness = u_refThickness / 100.0;
      float edgeFactor = 0.0;
      if (nmerged < thickness) {
        edgeFactor = pow(1.0 - nmerged / thickness, 2.0);
      }

      outColor = vec4(normalColor * edgeFactor, 0.1);
    } else {
      outColor = texture(u_bg, v_uv);
    }
    // add refaction
  } else if (STEP <= 4.0) {
    if (merged < 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      float nmerged = -10.0 * (merged * u_resolution.y) / 4000.0;
      float thickness = u_refThickness / 100.0;
      float edgeFactor = 0.0;
      if (nmerged < thickness) {
        edgeFactor = pow(1.0 - nmerged / thickness, 2.0);
      }
      if (edgeFactor <= 0.0) {
        outColor = texture(u_blurredBg, v_uv);
      } else {
        vec4 blurredPixel = texture(
          u_blurredBg,
          v_uv - normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0
        );
        vec4 unblurredPixel = texture(
          u_bg,
          v_uv - normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0
        );

        outColor = mix(blurredPixel, unblurredPixel, edgeFactor);
      }
    } else {
      outColor = texture(u_bg, v_uv);
    }
    //
  } else if (STEP <= 5.0) {
    if (merged < 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      float nmerged = -10.0 * (merged * u_resolution.y) / 4000.0;
      float thickness = u_refThickness / 100.0;
      float edgeFactor = 0.0;
      if (nmerged < thickness) {
        edgeFactor = pow(1.0 - nmerged / thickness, 2.0);
      }
      if (edgeFactor <= 0.0) {
        outColor = texture(u_blurredBg, v_uv);
      } else {
        vec4 blrredPixel = vec4(1.0);
        blrredPixel = texture(
          u_blurredBg,
          v_uv - normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0
        );

        vec4 unblurredPixel = getTextureDispersion(
          u_bg,
          -normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0,
          u_refDispersion
        );

        outColor = mix(blrredPixel, unblurredPixel, edgeFactor);
      }
    } else {
      outColor = texture(u_bg, v_uv);
    }
  } else if (STEP <= 6.0) {
    if (merged < 0.0) {
      vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
      float nmerged = -10.0 * (merged * u_resolution.y) / 4000.0;
      float thickness = u_refThickness / 100.0;
      float edgeFactor = 0.0;
      if (nmerged < thickness) {
        edgeFactor = pow(1.0 - nmerged / thickness, 2.0);
      }

      if (edgeFactor <= 0.0) {
        outColor = texture(u_blurredBg, v_uv);
      } else {
        vec4 blrredPixel = vec4(1.0);
        blrredPixel = texture(
          u_blurredBg,
          v_uv - normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0
        );

        vec4 unblurredPixel = getTextureDispersion(
          u_bg,
          -normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0,
          u_refDispersion
        );

        outColor = mix(blrredPixel, unblurredPixel, edgeFactor);

        float fresnelFactor =
          pow(edgeFactor, (60.0 - u_refFresnelRange) * thickness) * u_refFresnelFactor;
        // vec4 fresnelColor = outColor;
        // if (fresnelFactor > 0.0) {
        //   outColor = vec4(vec3(1.0) * fresnelFactor, 1.0);

        //   vec4 fresnelColor = outColor;
        //   if (fresnelFactor > 0.0) {
        //     fresnelColor = texture(
        //       u_bg,
        //       v_uv + normal * pow(fresnelFactor, 2.0) / u_resolution.y * 120.0
        //     );
        //     fresnelColor = mix(fresnelColor, vec4(1.0), fresnelFactor);

        //     outColor = fresnelColor;
        //   }
        // }

        // if (fresnelFactor > 0.0) {
        //   outColor = vec4(vec3(1.0) * fresnelFactor, 1.0);
        // }
        vec4 fresnelColor = outColor;
        if (fresnelFactor > 0.0) {
          fresnelColor = texture(
            u_bg,
            v_uv + normal * pow(fresnelFactor, 2.0) / u_resolution.y * 120.0
          );
          fresnelColor = mix(fresnelColor, vec4(1.0), fresnelFactor);
        }

        outColor = mix(fresnelColor, outColor, 1.0 - fresnelFactor);

      }

      // if (edgeFactor <= 0.0) {
      //   outColor = texture(u_blurredBg, v_uv);
      // } else {
      //   vec4 blrredPixel = vec4(1.0);
      //   blrredPixel = texture(
      //     u_blurredBg,
      //     v_uv - normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0
      //   );

      //   vec4 unblurredPixel = getTextureDispersion(
      //     u_bg,
      //     -normal * pow(edgeFactor, 2.0) / u_resolution.y * (u_refFactor - 1.0) * 120.0,
      //     u_refDispersion
      //   );

      //   outColor = mix(blrredPixel, unblurredPixel, edgeFactor);
      // }

    } else {
      outColor = texture(u_bg, v_uv);
    }
  }

  // float normalizedInside = merged / u_shapeHeight / u_resolution.y + 1.0;
  // float edgeBlendFactor = pow(normalizedInside, 12.0);
  // float smoothed = smoothstep(0.0, 0.0005, merged);

  // vec4 outColor;
  // if (merged < 0.0) {
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

  // float edgeEffect = pow(clamp(1.0 + merged * u_refEdge * u_resolution.y, 0.0, 1.0), 2.0);
  // float edgeEffect = 1.0;

  // if (edgeEffect > 0.0) {
  //   vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
  // vec3 normalColor = vec3((normal * 0.5 + 0.5) * edgeEffect, 0.0);
  // vec3 normalColor = vec3(clamp(normal.x, 0.0, 1.0), abs(normal.y), clamp(-normal.x, 0.0, 1.0));
  // vec3 normalColor = vec3()
  // // view edge
  // outColor = vec4(vec3(edgeEffect), 1.0);
  // // view normal
  // outColor = vec4(normalColor, 1.0);

  // outColor.r = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.6).r;
  // outColor.g = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.4).g;
  // outColor.b = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.8).b;

  // final color
  // outColor = texture(u_blurredBg, v_uv - normal * pow(edgeEffect, 5.0) * 30.0 / 800.0);

  // outColor.r = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).r;
  // outColor.g = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).g;
  // outColor.b = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).b;

  //   } else {
  //     outColor = texture(u_blurredBg, v_uv);
  //   }

  //   outColor = mix(outColor, vec4(u_tint.r, u_tint.g, u_tint.b, u_tint.a * 0.5), u_tint.a * 0.5);

  //   // outColor = vec4(mix(texture(u_blurredBg, v_uv).rgb, vec3(1.0), edgeEffect), 1.0);

  // } else {
  //   outColor = texture(u_bg, v_uv);
  // }

  fragColor = vec4(outColor.xyz, 1.0);
}
