import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import https from 'https'

// 安全约束：仅允许访问 GitHub 公共 API，拒绝其它任意 host
const ALLOWED_ORIGIN = 'https://api.github.com'
const USER = 'shi-tou1234'
const out = resolve(import.meta.dirname, '../src/data/github.json')

function readLastKnown() {
  try {
    const prev = JSON.parse(readFileSync(out, 'utf8'))
    if (Number.isFinite(prev.repos) && prev.repos > 0) return prev.repos
  } catch {
    /* 首次运行没有历史快照 */
  }
  return 0
}

function persist(repos, extra = {}) {
  writeFileSync(out, JSON.stringify({ repos, updatedAt: new Date().toISOString(), ...extra }))
}

function fetchJson(url, options) {
  return new Promise((resolveReq, rejectReq) => {
    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        rejectReq(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          resolveReq(JSON.parse(data))
        } catch (e) {
          rejectReq(new Error(`bad JSON: ${e.message}`))
        }
      })
    })
    req.on('error', rejectReq)
  })
}

const url = new URL(`/users/${USER}`, ALLOWED_ORIGIN)
if (url.protocol !== 'https:' || url.origin !== ALLOWED_ORIGIN) {
  console.error(`[fetch-github] blocked: only ${ALLOWED_ORIGIN} is allowed`)
  process.exit(1)
}

const headers = { 'User-Agent': 'cmchen-page', Accept: 'application/vnd.github+json' }
const token = process.env.GITHUB_TOKEN
if (token) headers.Authorization = `Bearer ${token}`

// 被TLS拦截代理的开发机可设 GH_INSECURE_TLS=1 放宽校验；默认严格校验
const options = {}
if (process.env.GH_INSECURE_TLS === '1') options.rejectUnauthorized = false

try {
  const data = await fetchJson(url, { ...options, headers })
  const repos = Number(data.public_repos)
  if (!Number.isFinite(repos) || repos <= 0) {
    throw new Error(`invalid public_repos: ${String(data.public_repos)}`)
  }
  persist(repos)
  console.log(`[fetch-github] repos: ${repos}${token ? ' (token)' : ''}`)
} catch (e) {
  // 拉取失败时保留上次有效值，绝不用 0 覆盖；构建继续，页面运行时会再拉一次
  const last = readLastKnown()
  persist(last, { error: String(e) })
  console.warn(`[fetch-github] failed (${e.message}), keeping last known repos: ${last}`)
}
