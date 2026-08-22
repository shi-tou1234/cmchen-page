// GitHub REST API 客户端（浏览器端）。
// 安全约束：只允许 https://api.github.com 一个 host，拒绝 localhost/环回/私有/保留地址。
const API_ORIGIN = 'https://api.github.com'
export const REPO = 'shi-tou1234/cmchen-page'

export class GitHubApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function isPrivateOrReservedHost(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  return (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h === '::1' ||
    h === '0.0.0.0' ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h)
  )
}

export function buildApiUrl(path) {
  const url = new URL(path, API_ORIGIN)
  if (url.protocol !== 'https:' || url.origin !== API_ORIGIN) {
    throw new GitHubApiError(0, `安全拦截：仅允许 ${API_ORIGIN}`)
  }
  if (isPrivateOrReservedHost(url.hostname)) {
    throw new GitHubApiError(0, `安全拦截：禁止访问内网地址 ${url.hostname}`)
  }
  return url
}

export async function githubRequest(path, token, options = {}) {
  const url = buildApiUrl(path)
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json'
  }
  let res
  try {
    res = await fetch(url, { ...options, headers, cache: 'no-store' })
  } catch (e) {
    throw new GitHubApiError(0, `网络请求失败：${e.message}`)
  }
  if (res.status === 204) return null
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const j = await res.json()
      if (j && j.message) detail = j.message
    } catch {
      /* 非 JSON 错误体，用默认信息 */
    }
    throw new GitHubApiError(res.status, detail)
  }
  return res.json()
}

export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function base64ToUtf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function contentsPath(filePath) {
  return `/repos/${REPO}/contents/${filePath}`
}

export async function readFile(filePath, token, branch) {
  const meta = await githubRequest(
    `${contentsPath(filePath)}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
    token
  )
  if (!meta || typeof meta.content !== 'string') {
    throw new GitHubApiError(0, '文件内容读取失败（可能过大或非文本）')
  }
  return { sha: meta.sha, text: base64ToUtf8(meta.content) }
}

// PUT contents：先取 sha 再提交，409/422 冲突自动重取 sha 重试一次
export async function writeFile(filePath, text, message, token, branch) {
  const apiPath = contentsPath(filePath)
  for (let attempt = 0; attempt < 2; attempt++) {
    let sha
    try {
      const meta = await githubRequest(
        `${apiPath}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
        token
      )
      sha = meta && meta.sha
    } catch (e) {
      if (!(e instanceof GitHubApiError && e.status === 404)) throw e
    }
    try {
      return await githubRequest(apiPath, token, {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: utf8ToBase64(text),
          branch,
          ...(sha ? { sha } : {}),
        }),
      })
    } catch (e) {
      const conflict =
        e instanceof GitHubApiError && (e.status === 409 || e.status === 422)
      if (!conflict || attempt === 1) throw e
    }
  }
  return null
}

export async function testConnection(token) {
  if (!token) return { ok: false, message: '请先填写 GitHub Token' }
  const user = await githubRequest('/user', token)
  const login = (user && user.login) || '未知'
  try {
    await githubRequest(`/repos/${REPO}`, token)
  } catch (e) {
    if (e.status === 404) {
      return { ok: false, message: `用户 ${login} 无法访问仓库 ${REPO}（404）` }
    }
    if (e.status === 401 || e.status === 403) {
      return {
        ok: false,
        message: `Token 无效或对 ${REPO} 没有写入权限（请确认勾选 repo 权限）`,
      }
    }
    throw e
  }
  return { ok: true, message: `连接成功：${login}，仓库 ${REPO} 可访问` }
}
