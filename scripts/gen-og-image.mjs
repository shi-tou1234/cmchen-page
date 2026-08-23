// 生成 public/og-image.png（1200x630 深空分享图），零依赖：纯 Node + zlib 手写 PNG。
// 用法: node scripts/gen-og-image.mjs   （重新生成前先删除旧文件）
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const W = 1200
const H = 630
const OUT = resolve(import.meta.dirname, '../public/og-image.png')

/* ---- 确定性伪随机（每次生成结果一致） ---- */
function makeHash(seed) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967295
  }
}

/* ---- 场景合成（float 亮度累加，最后 clamp） ---- */
const buf = new Float32Array(W * H * 3)

function addPixel(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 3
  buf[i] += r
  buf[i + 1] += g
  buf[i + 2] += b
}

// 底色：垂直渐变 深黑蓝 -> 微蓝
for (let y = 0; y < H; y++) {
  const t = y / H
  for (let x = 0; x < W; x++) {
    addPixel(x, y, 0.010 + t * 0.012, 0.012 + t * 0.018, 0.022 + t * 0.034)
  }
}

// 银河带：沿对角的窄带亮度抬升（与站点背景构图呼应）
{
  const nx = -0.373, ny = 0.928, c = -0.05
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = (x / W) * 2 - 1
      const py = (y / H) * 2 - 1
      const d = Math.abs(nx * px + ny * py - c)
      const band = Math.exp(-d * d * 14) * 0.045 + Math.exp(-d * d * 40) * 0.030
      addPixel(x, y, band * 0.72, band * 0.82, band * 1.15)
    }
  }
}

// 两团冷色 glow（蓝 / 青，克制的低透明度）
function glow(cx, cy, radius, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - radius))
  const x1 = Math.min(W - 1, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius))
  const y1 = Math.min(H - 1, Math.ceil(cy + radius))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy) / radius
      if (d >= 1) continue
      const f = Math.exp(-d * d * 3.2)
      addPixel(x, y, r * f, g * f, b * f)
    }
  }
}
glow(W * 0.74, H * 0.30, W * 0.42, 0.050, 0.075, 0.150)
glow(W * 0.18, H * 0.78, W * 0.36, 0.020, 0.070, 0.078)

// 星点：陡峭亮度分布，多数极暗、少数亮星带柔和光晕
{
  const rnd = makeHash(20260823)
  for (let i = 0; i < 950; i++) {
    const x = Math.round(rnd() * (W - 1))
    const y = Math.round(rnd() * (H - 1))
    const m = Math.pow(rnd(), 3.2) // 亮度（星等）
    const bright = 0.12 + m * 0.88
    // 色温：偏冷白为主，少量暖星
    const warm = rnd() < 0.18
    const r = warm ? bright : bright * 0.82
    const g = bright * 0.90
    const b = warm ? bright * 0.78 : bright
    addPixel(x, y, r, g, b)
    if (m > 0.55) {
      // 亮星：3x3 柔和光晕
      const f = 0.30
      addPixel(x - 1, y, r * f, g * f, b * f)
      addPixel(x + 1, y, r * f, g * f, b * f)
      addPixel(x, y - 1, r * f, g * f, b * f)
      addPixel(x, y + 1, r * f, g * f, b * f)
    }
    if (m > 0.9) {
      // 极亮星：额外十字微芒
      const f = 0.16
      for (let k = -2; k <= 2; k++) {
        addPixel(x + k, y, r * f * (1 - Math.abs(k) * 0.2), g * f, b * f)
        addPixel(x, y + k, r * f, g * f * (1 - Math.abs(k) * 0.2), b * f)
      }
    }
  }
}

/* ---- PNG 打包 ---- */
function crc32(bytes) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

// scanlines（每行前加 filter byte 0），RGB 三通道，暗部微抖动避免色带
const raw = Buffer.alloc((W * 3 + 1) * H)
const rnd2 = makeHash(777)
{
  let o = 0
  for (let y = 0; y < H; y++) {
    raw[o++] = 0
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      const dith = (rnd2() - 0.5) * (1.5 / 255)
      for (let c = 0; c < 3; c++) {
        const v = Math.min(1, Math.max(0, buf[i + c] + dith))
        raw[o++] = Math.round(v * 255)
      }
    }
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // color type: truecolor RGB
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync(OUT, png)
console.log(`[gen-og-image] written ${OUT} (${(png.length / 1024).toFixed(1)} kB)`)
