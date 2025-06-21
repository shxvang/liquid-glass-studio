#version 300 es

precision highp float;

in vec4 v_color;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float sdCircle( vec2 p, float r ) {
    return length(p) - r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
  float d = sdCircle(uv, 0.2);
  float a = smoothstep(0.0, 0.01, d);
  fragColor = vec4(vec3(a), 1.0);
}
