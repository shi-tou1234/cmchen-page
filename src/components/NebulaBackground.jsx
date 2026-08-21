import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

// 星星柔光核心：圆形光斑，亮度权重向小半径集中，带轻微闪烁
float starCore(vec2 p, float size, float t, float ph) {
  float d = length(p);
  float s = smoothstep(size, 0.0, d);
  s *= s;
  float tw = 0.62 + 0.38 * sin(t * (0.8 + 1.6 * ph) + ph * 6.2831);
  return s * (0.35 + 0.65 * tw);
}

// 亮星的十字衍射光：细长光臂，营造真实亮星观感
float starSparkle(vec2 p, float size, float t, float ph) {
  float sxx = exp(-p.x * p.x * size * 900.0);
  float syy = exp(-p.y * p.y * size * 900.0);
  float tw = 0.6 + 0.4 * sin(t * 1.1 + ph * 3.0);
  return (sxx + syy) * tw * 0.5;
}

// 单层星野：少量亮星 + 大量暗星，柔和发光，带随机的暖/冷色温
vec3 starLayer(vec2 uv, float scale, float density, float baseSize, float t, vec2 seed) {
  vec2 g = uv * scale + seed;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  if (h > density) return vec3(0.0);

  vec2 jit = (vec2(hash(id + 11.7), hash(id + 5.3)) - 0.5) * 0.72;
  vec2 p = f - jit;
  float mag = pow(hash(id + 7.7), 2.4);
  float size = baseSize * (0.35 + 2.4 * mag);
  float ph = hash(id + 3.3);
  float ph2 = hash(id + 8.9);

  vec3 tint = mix(vec3(0.90, 0.95, 1.0), vec3(1.0, 0.90, 0.78), step(0.9, ph));
  vec3 c = tint * (starCore(p, size, t, ph2) * (0.06 + 1.4 * mag));
  if (mag > 0.6) {
    c += tint * starSparkle(p, size, t, ph2) * (mag - 0.6) * 1.4;
  }
  return c;
}

// 流星：整体滑动柔和、头亮尾暗，数量克制不刺眼
vec3 meteor(vec2 uv, float t, float offset) {
  float period = 10.0;
  float id = floor((t + offset) / period);
  float lt = fract((t + offset) / period);
  float env = smoothstep(0.0, 0.10, lt) * (1.0 - smoothstep(0.45, 0.72, lt));
  if (env <= 0.001) return vec3(0.0);

  vec2 start = vec2(hash(vec2(id, 1.37)) * 3.4 - 1.7, 0.62 + hash(vec2(id, 2.91)) * 0.5);
  vec2 dir = normalize(vec2(-(0.55 + hash(vec2(id, 3.11)) * 0.45), -(0.32 + hash(vec2(id, 4.7)) * 0.4)));
  vec2 head = start + dir * lt * 2.3;

  vec2 pa = uv - head;
  float proj = -dot(pa, dir);
  float perp = length(pa + dir * max(proj, 0.0));
  float along = max(proj, 0.0);

  vec3 c = vec3(0.85, 0.92, 1.0);
  c *= 0.30 * exp(-perp * perp * 900.0) * exp(-along * 3.0) * env;
  c += vec3(1.0, 0.98, 0.94) * exp(-dot(pa, pa) * 1400.0) * env * 0.55;
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.04;

  vec2 q = vec2(
    fbm(uv * 1.9 + vec2(0.0, t)),
    fbm(uv * 1.9 + vec2(5.2, 1.3) - t * 0.7)
  );
  vec2 r = vec2(
    fbm(uv * 1.9 + 2.6 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(uv * 1.9 + 2.6 * q + vec2(8.3, 2.8) - t * 0.35)
  );
  float f = fbm(uv * 1.9 + 2.4 * r);

  float ridge = 1.0 - abs(2.0 * f - 1.0);
  ridge = pow(clamp(ridge, 0.0, 1.0), 7.0);

  float wash = smoothstep(0.30, 0.95, f);

  // 朝上渐亮，让整页背景在滚动时自然过渡，不与正文抢戏
  float topGlow = smoothstep(0.5, -0.9, uv.y) * 0.4;
  float breathe = 0.82 + 0.18 * sin(u_time * 0.22);

  vec3 col = vec3(0.020, 0.022, 0.030);
  col += vec3(0.045, 0.075, 0.135) * wash * (0.45 + 0.35 * topGlow);
  col += vec3(0.110, 0.185, 0.330) * ridge * (0.28 + 0.55 * q.y) * breathe * (0.82 + 0.28 * topGlow);
  col += vec3(0.170, 0.105, 0.270) * pow(clamp(q.x, 0.0, 1.0), 3.0) * 0.20;
  col += vec3(0.050, 0.135, 0.145) * pow(clamp(r.y, 0.0, 1.0), 3.0) * 0.26;

  // 光标附近柔和光晕，制造跟随感
  vec2 m = (u_mouse * 2.0 - u_res) / min(u_res.x, u_res.y);
  vec2 par = clamp(m, vec2(-1.5), vec2(1.5));

  // 星野：三层不同疏密/大小的星星，按视差轻微偏移制造纵深
  vec3 stars = vec3(0.0);
  stars += starLayer(uv + par * 0.010, 14.0, 0.40, 0.011, u_time * 2.0, vec2(0.0));
  stars += starLayer(uv + par * 0.022 + vec2(31.7, 19.3), 30.0, 0.36, 0.007, u_time * 2.0, vec2(73.1, 12.9));
  stars += starLayer(uv + par * 0.038 + vec2(77.1, 51.9), 56.0, 0.30, 0.004, u_time * 2.0, vec2(11.3, 47.7));
  col += stars;

  // 流星：两条错峰出现，克制且柔和
  vec3 met = vec3(0.0);
  met += meteor(uv, u_time, 0.0);
  met += meteor(uv, u_time, 5.0);
  col += met;

  col += vec3(0.30, 0.46, 0.80) * exp(-dot(uv - m, uv - m) * 5.0) * 0.10;

  // 暗角
  col *= mix(0.5, 1.0, smoothstep(1.85, 0.35, length(uv)));

  float g = hash(gl_FragCoord.xy + fract(u_time) * 61.7);
  col += (g - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function NebulaBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const compile = (type, src) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader))
        return null
      }
      return shader
    }

    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )
    const locPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(locPos)
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    let dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const mouse = { tx: -2000, ty: -2000, x: -2000, y: -2000 }
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.tx = (e.clientX - rect.left) * dpr
      mouse.ty = canvas.height - (e.clientY - rect.top) * dpr
    }
    const onLeave = () => {
      mouse.tx = -2000
      mouse.ty = -2000
    }

    let raf = 0
    let active = true
    const t0 = performance.now()

    const frame = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = active && !document.hidden ? requestAnimationFrame(frame) : 0
    }

    const wake = () => {
      if (!raf && active && !document.hidden && !reduced) {
        raf = requestAnimationFrame(frame)
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
      wake()
    })
    io.observe(canvas)

    const onResize = () => {
      resize()
      wake()
    }

    resize()
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', wake)

    if (reduced) {
      // 静态帧：星云取中间亮度，保持统一观感
      gl.uniform1f(uTime, 25.0)
      gl.uniform2f(uMouse, -2000, -2000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    } else {
      wake()
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />
}
