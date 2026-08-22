// 后台密码锁：PBKDF2-SHA256，哈希配置存于 public/admin-security.json（随站点一起部署）

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function securityConfigUrl() {
  return `${import.meta.env.BASE_URL}admin-security.json`
}

export async function loadSecurityConfig() {
  try {
    const res = await fetch(securityConfigUrl(), { cache: 'no-store' })
    if (!res.ok) return null
    const cfg = await res.json()
    return cfg && cfg.hash && cfg.salt && cfg.iterations ? cfg : null
  } catch {
    return null
  }
}

async function derive(password, cfg) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(cfg.salt),
      iterations: cfg.iterations,
    },
    key,
    256
  )
  return bytesToHex(new Uint8Array(bits))
}

export async function verifyPassword(password, cfg) {
  if (!cfg) return true // 未配置密码则不设防
  return (await derive(password, cfg)) === cfg.hash
}

export async function makeSecurityConfig(password, iterations = 120000) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cfg = { algorithm: 'PBKDF2-SHA256', iterations, salt: bytesToHex(salt), hash: '' }
  cfg.hash = await derive(password, cfg)
  return cfg
}
