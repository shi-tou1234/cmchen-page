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
uniform float u_par;
uniform float u_star;

#define TAU 6.28318530718

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot(0.63) * p * 2.02 + vec2(11.3, 7.9);
    a *= 0.53;
  }
  return v;
}

float ridge(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    float n = 1.0 - abs(vnoise(p) * 2.0 - 1.0);
    v += a * n * n;
    p = rot(-0.47) * p * 2.13 + vec2(3.1, 17.7);
    a *= 0.52;
  }
  return v;
}

// 真实感点源星：高斯 PSF、陡峭星等分布、轻微大气闪烁；无十字光臂
float starField(vec2 uv, float scale, float density, float baseSize, float t, vec2 seed) {
  vec2 g = uv * scale + seed;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  if (h > density) return 0.0;

  vec2 jit = (vec2(hash(id + 7.13), hash(id + 3.71)) - 0.5) * 0.82;
  vec2 p = f - jit;
  float mag = pow(hash(id + 9.41), 4.0);
  float size = baseSize * (0.25 + 1.7 * mag);
  float ph = hash(id + 1.17);

  float tw = 0.88 + 0.12 * sin(t * (0.3 + 1.2 * h) + ph * TAU);
  tw *= 0.96 + 0.04 * sin(t * (1.1 + 1.9 * h) + ph * 7.0);

  float d = length(p);
  float s2 = size * size;
  float glow = exp(-d * d / (s2 * 0.60));
  float hot = exp(-d * d / (s2 * 0.10));
  return (glow * 0.85 + hot * 0.65) * tw * (0.08 + 1.5 * mag);
}

// 真实流星：高速细线，头部小亮斑，尾迹指数衰减并短暂余迹
vec3 meteor(vec2 uv, float t, float offset) {
  float period = 17.0;
  float id = floor((t + offset) / period);
  float lt = fract((t + offset) / period);

  if (hash(vec2(id, 7.77)) > 0.55) return vec3(0.0);

  // 快速生命周期：约 0.75 个单位时间内划过
  float life = smoothstep(0.03, 0.075, lt) * (1.0 - smoothstep(0.10, 0.155, lt));
  if (life <= 0.001) return vec3(0.0);

  vec2 start = vec2(mix(1.45, -0.5, hash(vec2(id, 1.37))), mix(1.15, 0.50, hash(vec2(id, 2.91))));
  float ang = mix(-2.95, -2.20, hash(vec2(id, 3.11)));
  vec2 dir = vec2(cos(ang), sin(ang));
  float speed = mix(26.0, 38.0, hash(vec2(id, 4.7)));
  vec2 head = start + dir * lt * speed;

  // 尾迹：头后方一段渐隐细线
  float trailLen = 0.42 + 0.30 * hash(vec2(id, 5.5));
  vec2 ta = head - dir * trailLen;
  vec2 pa = uv - ta;
  vec2 ba = dir * trailLen;
  float hp = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float ds = length(pa - ba * hp);

  float w = mix(0.0055, 0.0028, hp);
  float body = exp(-ds * ds / (w * w)) * pow(hp, 1.35);

  vec3 headCol = vec3(1.0, 0.99, 0.97);
  vec3 tailCol = vec3(0.58, 0.74, 1.0);
  vec3 col = mix(tailCol, headCol, hp) * body * life * 1.6;

  float dh = length(uv - head);
  col += headCol * exp(-dh * dh / 0.00022) * life * 0.55;

  // 余迹：整段轨迹上残留微光快速消散
  float trainEnv = smoothstep(0.08, 0.20, lt) * (1.0 - smoothstep(0.16, 0.34, lt));
  if (trainEnv > 0.001) {
    float train = exp(-ds * ds / (w * w * 4.0)) * hp * trainEnv;
    col += tailCol * train * 0.18;
  }
  return col;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float T = u_time;
  float t = T * 0.05;

  vec2 m = (u_mouse * 2.0 - u_res) / min(u_res.x, u_res.y);
  m = clamp(m, vec2(-1.6), vec2(1.6)) * u_par * u_star;

  vec2 pN = uv + m * 0.015 + vec2(t * 0.020, -t * 0.012);
  vec2 pS1 = uv + m * 0.030 + vec2(t * 0.030, -t * 0.018);
  vec2 pS2 = uv + m * 0.048 + vec2(t * 0.042, -t * 0.026);
  vec2 pS3 = uv + m * 0.070 + vec2(t * 0.058, -t * 0.036);

  vec2 q = vec2(
    fbm(pN * 1.6 + vec2(0.0, t)),
    fbm(pN * 1.6 + vec2(5.2, 1.3) - t * 0.7)
  );
  vec2 r = vec2(
    fbm(pN * 1.6 + q * 2.2 + vec2(1.7, 9.2) + t * 0.4),
    fbm(pN * 1.6 + q * 2.2 + vec2(8.3, 2.8) - t * 0.3)
  );
  float f = fbm(pN * 1.6 + r * 2.0);

  float fil = ridge(pN * 2.1 + r * 1.5 + q * 0.8);
  fil = pow(clamp(fil * 0.72, 0.0, 1.0), 3.0);

  float wash = smoothstep(0.32, 0.92, f);
  float breathe = 0.80 + 0.20 * sin(T * 0.18);

  vec3 col = vec3(0.014, 0.016, 0.026);
  col += vec3(0.012, 0.020, 0.040) * smoothstep(-1.2, 1.0, uv.y);

  col += mix(vec3(0.020, 0.035, 0.075), vec3(0.055, 0.105, 0.190), wash) * (0.55 + 0.35 * breathe);
  col += vec3(0.070, 0.240, 0.290) * fil * breathe * (0.55 + 0.45 * q.y);

  float coreHot = wash * smoothstep(0.55, 1.05, fil * 1.6);
  col += vec3(0.180, 0.420, 0.520) * coreHot * breathe;

  col += vec3(0.230, 0.150, 0.075) * pow(clamp(r.x, 0.0, 1.0), 3.5) * wash * 0.35;

  col *= mix(1.0, 0.62, smoothstep(0.45, 0.85, f) * 0.6);

  vec3 tintCold = vec3(0.85, 0.91, 1.0);
  vec3 tintWarm = vec3(1.0, 0.88, 0.70);

  float l1 = starField(pS1, 12.0, 0.52, 0.0105, T * 0.9, vec2(3.1, 7.7));
  vec3 s1 = mix(tintCold, tintWarm, step(0.94, hash(floor((pS1) * 12.0 + vec2(3.1, 7.7)) + 1.17))) * l1;
  col += s1 * u_star;

  float l2 = starField(pS2, 24.0, 0.46, 0.0068, T * 1.1, vec2(41.3, 9.2));
  vec3 s2 = mix(tintCold, tintWarm, step(0.96, hash(floor((pS2) * 24.0 + vec2(41.3, 9.2)) + 1.17))) * l2;
  col += s2 * u_star;

  float l3 = starField(pS3, 48.0, 0.38, 0.0042, T * 1.3, vec2(77.1, 51.9));
  col += tintCold * l3 * u_star;

  col += meteor(uv, T, 0.0) * u_star;
  col += meteor(uv, T, 8.5) * u_star;

  col += vec3(0.25, 0.42, 0.75) * exp(-dot(uv - m, uv - m) * 4.5) * 0.10 * u_par * u_star;

  col = aces(col * 1.25);

  float vig = smoothstep(1.9, 0.45, length(uv));
  col *= mix(0.42, 1.0, vig);

  float g = hash(gl_FragCoord.xy + fract(T) * 61.7);
  col += (g - 0.5) * 0.014;

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
    const uPar = gl.getUniformLocation(program, 'u_par')
    const uStar = gl.getUniformLocation(program, 'u_star')

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

    let parLimit = 1
    let starLimit = 1
    const updateLimits = () => {
      const vh = window.innerHeight || 1
      const el = document.getElementById('projects')
      parLimit = el ? Math.max(el.offsetTop - vh * 0.55, vh * 0.35) : vh * 0.9
      starLimit = vh * 1.05
    }
    let parTarget = 1
    let starTarget = 1
    const onScroll = () => {
      const y = window.scrollY
      parTarget = Math.max(0, Math.min(1, 1 - y / parLimit))
      starTarget = Math.max(0, Math.min(1, 1 - y / starLimit))
    }

    let raf = 0
    let active = true
    let par = 1
    let star = 1
    const t0 = performance.now()

    const frame = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      par += (parTarget - par) * 0.08
      star += (starTarget - star) * 0.09
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uPar, par)
      gl.uniform1f(uStar, star)
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
      updateLimits()
      onScroll()
      wake()
    }

    resize()
    updateLimits()
    onScroll()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', wake)

    if (reduced) {
      gl.uniform1f(uTime, 25.0)
      gl.uniform2f(uMouse, -2000, -2000)
      gl.uniform1f(uPar, parTarget)
      gl.uniform1f(uStar, starTarget)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    } else {
      wake()
    }

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />
}
