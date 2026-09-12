import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import https from 'https'

// 旅行数据与博客站点保持同源：从博客仓库的 about-personal.ts 提取 travelCities，
// 快照落到 src/data/generated/travel.json。博客更新后，作品集下次 dev/build 自动跟上。
const RAW_ORIGIN = 'https://raw.githubusercontent.com'
const REPO = '/shi-tou1234/cmchen-blog'
const TS_PATH = '/main/src/data/about-personal.ts'
const outDir = resolve(import.meta.dirname, '../src/data/generated')
const out = resolve(outDir, 'travel.json')
// 本机相邻仓库回退（CI 上不存在则自动跳过）：离线开发也能拿到与博客一致的最新数据
const LOCAL_TS = resolve(import.meta.dirname, '../../博客站点/src/data/about-personal.ts')

const options = {}
if (process.env.GH_INSECURE_TLS === '1') options.rejectUnauthorized = false

function extractCities(ts) {
  const start = ts.indexOf('"travelCities"')
  if (start === -1) throw new Error('travelCities 段不存在')
  const end = ts.indexOf(']', start)
  const block = ts.slice(start, end)
  const cities = []
  const re = /"province"\s*:\s*"([^"]+)"\s*,\s*"city"\s*:\s*"([^"]+)"\s*,\s*"visited"\s*:\s*(true|false)/g
  let m
  while ((m = re.exec(block))) {
    cities.push({ province: m[1], city: m[2], visited: m[3] === 'true' })
  }
  if (!cities.length) throw new Error('未解析到任何城市')
  return cities
}

function fetchText(url) {
  return new Promise((resolveReq, rejectReq) => {
    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        rejectReq(new Error(`HTTP ${res.statusCode}`))
        return
      }
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolveReq(data))
    })
    req.on('error', rejectReq)
    // 开发机被 TLS 代理拦截时可能长时间挂起：6s 不通就走回退
    req.setTimeout(6000, () => {
      req.destroy(new Error('timeout'))
    })
  })
}

function readLastKnown() {
  try {
    const prev = JSON.parse(readFileSync(out, 'utf8'))
    if (Array.isArray(prev.cities) && prev.cities.length) return prev
  } catch {
    /* 首次运行没有历史快照 */
  }
  return null
}

function persist(cities, source) {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    out,
    JSON.stringify({ source, updatedAt: new Date().toISOString(), cities }, null, 2),
  )
}

async function main() {
  // 主路线：GitHub raw（分支容错 main → master）
  for (const branch of ['main', 'master']) {
    try {
      const ts = await fetchText(`${RAW_ORIGIN}${REPO}/${branch}${TS_PATH}`)
      const cities = extractCities(ts)
      persist(cities, `github:${branch}`)
      console.log(`[fetch-travel] cities: ${cities.length} (github/${branch})`)
      return
    } catch {
      /* 换下一条路线 */
    }
  }

  // 回退一：本机相邻的博客仓库（与线上同源文件）
  if (existsSync(LOCAL_TS)) {
    const cities = extractCities(readFileSync(LOCAL_TS, 'utf8'))
    persist(cities, 'local-sibling')
    console.log(`[fetch-travel] cities: ${cities.length} (local 博客站点)`)
    return
  }

  // 回退二：保留上次快照，绝不用空数据覆盖
  const last = readLastKnown()
  if (last) {
    console.warn(`[fetch-travel] failed, keeping last known snapshot: ${last.cities.length} cities`)
    return
  }
  console.error('[fetch-travel] 无任何数据来源可用，且没有历史快照')
  process.exit(1)
}

main()
