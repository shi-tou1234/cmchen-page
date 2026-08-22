import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { webcrypto as crypto } from 'crypto'

// 用法: node scripts/gen-admin-hash.mjs <密码> [迭代次数]
// 生成 public/admin-security.json（PBKDF2-SHA256 哈希），后台登录用它校验
const password = process.argv[2]
if (!password) {
  console.error('用法: node scripts/gen-admin-hash.mjs <密码> [迭代次数]')
  process.exit(1)
}
const iterations = Number(process.argv[3]) || 120000

const salt = crypto.getRandomValues(new Uint8Array(16))
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveBits']
)
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
  key,
  256
)

const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('')
const cfg = {
  algorithm: 'PBKDF2-SHA256',
  iterations,
  salt: hex(salt),
  hash: hex(new Uint8Array(bits)),
}

const out = resolve(import.meta.dirname, '../public/admin-security.json')
writeFileSync(out, JSON.stringify(cfg, null, 2) + '\n')
console.log(`[gen-admin-hash] written ${out} (iterations=${iterations})`)
