import { useEffect, useState } from 'react'
import { ADMIN_SECURITY_PATH, CONTENT_FILES, initialDraft } from './files'
import { readFile, testConnection, writeFile } from './github'
import { loadSecurityConfig, makeSecurityConfig, verifyPassword } from './security'

const ADMIN_OK = 'cmchen-page:admin-ok'
const GH_TOKEN = 'cmchen-page:gh-token'
const GH_REMEMBER = 'cmchen-page:gh-remember'
const GH_BRANCH = 'cmchen-page:gh-branch'

const linkFields = [
  { key: 'label', label: '文字' },
  { key: 'href', label: '链接/锚点' },
]

const SCHEMAS = {
  site: [
    { key: 'logo', label: 'Logo 文字', type: 'text' },
    { key: 'navLinks', label: '导航链接', type: 'objList', itemFields: linkFields, template: { label: '新链接', href: '#' } },
    { key: 'navCta', label: '导航右侧按钮', type: 'object', fields: linkFields },
    { key: 'footerCopy', label: '页脚版权文字', type: 'text' },
  ],
  hero: [
    { key: 'name', label: '名字（大标题）', type: 'text' },
    { key: 'eyebrow', label: '眉题', type: 'text' },
    { key: 'roles', label: '轮换身份（逐个切换展示）', type: 'strList' },
    { key: 'subtitle', label: '副标题', type: 'textarea' },
    { key: 'ctaPrimary', label: '主按钮', type: 'object', fields: linkFields },
    { key: 'ctaSecondary', label: '次按钮', type: 'object', fields: linkFields },
    { key: 'scrollHint', label: '滚动提示文字', type: 'text' },
  ],
  about: [
    { key: 'intro', label: '简介（可用 <em>强调文字</em> 加下划高亮）', type: 'textarea' },
    { key: 'facts', label: '事实列表', type: 'objList', itemFields: [{ key: 'k', label: '项目' }, { key: 'v', label: '内容' }], template: { k: '新条目', v: '' } },
    { key: 'note', label: '备注段落', type: 'textarea' },
  ],
  awards: [
    { key: 'items', label: '竞赛条目', type: 'objList', itemFields: [
      { key: 'year', label: '年份' },
      { key: 'name', label: '竞赛名称' },
      { key: 'group', label: '赛区/组别' },
      { key: 'result', label: '奖项' },
      { key: 'level', label: '级别（如 省级/国家级）' },
    ], template: { year: '2026', name: '', group: '', result: '', level: '省级' } },
    { key: 'footNote', label: '底部说明', type: 'text' },
  ],
  projects: [
    { key: 'title', label: '区块标题', type: 'text' },
    { key: 'viewAll', label: '「查看全部」链接', type: 'object', fields: linkFields },
    { key: 'items', label: '项目列表', type: 'objList', itemFields: [
      { key: 'index', label: '序号（01/02…）' },
      { key: 'title', label: '名称' },
      { key: 'kind', label: '类型' },
      { key: 'year', label: '年份' },
      { key: 'desc', label: '描述', type: 'textarea' },
      { key: 'tags', label: '技术标签', type: 'strList' },
      { key: 'theme', label: '配色', type: 'select', options: ['blue', 'teal', 'ice', 'ember'] },
      { key: 'link', label: '仓库/演示链接' },
    ], template: { index: '05', title: '', kind: '', year: '2026', desc: '', tags: [], theme: 'blue', link: '' } },
  ],
  stats: [
    { key: 'items', label: '统计项（首格「开源项目」由 GitHub 自动统计）', type: 'objList', itemFields: [
      { key: 'label', label: '名称' },
      { key: 'value', label: '数值', type: 'number' },
      { key: 'suffix', label: '后缀（+ / 年…）' },
      { key: 'pad', label: '补零位数', type: 'number' },
    ], template: { label: '新统计', value: 1, suffix: '+', pad: 2 } },
  ],
  contact: [
    { key: 'kicker', label: '眉题', type: 'text' },
    { key: 'titleLines', label: '大标题（每行一条）', type: 'strList' },
    { key: 'email', label: '邮箱（点击复制）', type: 'text' },
    { key: 'githubButton', label: 'GitHub 按钮', type: 'object', fields: linkFields },
    { key: 'metaLeft', label: '底部信息 · 左', type: 'text' },
    { key: 'metaRight', label: '底部信息 · 右', type: 'text' },
  ],
  blog: [
    { key: 'url', label: '博客地址', type: 'text' },
    { key: 'typewriter', label: '打字机文案', type: 'text' },
    { key: 'viewAllLabel', label: '「全部文章」文字', type: 'text' },
    { key: 'loadingText', label: '加载中文案', type: 'text' },
    { key: 'errorText', label: '加载失败文案', type: 'text' },
  ],
  marquee: [{ key: 'items', label: '滚动技能词', type: 'strList' }],
}

function TextField({ label, value, onChange, textarea, type = 'text' }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {textarea ? (
        <textarea
          className="admin-input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          type={type}
          value={value ?? ''}
          onChange={(e) =>
            onChange(type === 'number' ? Number(e.target.value || 0) : e.target.value)
          }
        />
      )}
    </div>
  )
}

function StrListEditor({ label, items, onChange }) {
  const set = (i, v) => onChange(items.map((it, j) => (j === i ? v : it)))
  const move = (i, d) => {
    const a = [...items]
    const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    onChange(a)
  }
  const remove = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="admin-field">
      <label>{label}</label>
      {items.map((it, i) => (
        <div className="admin-row admin-row--item" key={i}>
          <input
            className="admin-input"
            style={{ flex: 1 }}
            type="text"
            value={it}
            onChange={(e) => set(i, e.target.value)}
          />
          <button type="button" className="admin-btn admin-btn--small" onClick={() => move(i, -1)} aria-label="上移">↑</button>
          <button type="button" className="admin-btn admin-btn--small" onClick={() => move(i, 1)} aria-label="下移">↓</button>
          <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => remove(i)} aria-label="删除">✕</button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--small" onClick={() => onChange([...items, ''])}>
        + 添加
      </button>
    </div>
  )
}

function ObjectEditor({ label, fields, value, onChange }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-grid2">
        {fields.map((f) => (
          <TextField
            key={f.key}
            label={f.label}
            value={value[f.key]}
            onChange={(v) => onChange({ ...value, [f.key]: v })}
          />
        ))}
      </div>
    </div>
  )
}

function ObjListEditor({ label, items, itemFields, template, onChange }) {
  const setItem = (i, v) => onChange(items.map((it, j) => (j === i ? v : it)))
  const move = (i, d) => {
    const a = [...items]
    const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    onChange(a)
  }
  const remove = (i) => onChange(items.filter((_, j) => j !== i))
  return (
    <div className="admin-field">
      <label>{label}</label>
      {items.map((it, i) => (
        <div className="admin-item" key={i}>
          <div className="admin-item-head">
            <span>#{i + 1}</span>
            <div className="admin-item-tools">
              <button type="button" className="admin-btn admin-btn--small" onClick={() => move(i, -1)} aria-label="上移">↑</button>
              <button type="button" className="admin-btn admin-btn--small" onClick={() => move(i, 1)} aria-label="下移">↓</button>
              <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => remove(i)} aria-label="删除">✕</button>
            </div>
          </div>
          {itemFields.map((f) => {
            if (f.type === 'strList') {
              return (
                <StrListEditor
                  key={f.key}
                  label={f.label}
                  items={it[f.key] || []}
                  onChange={(v) => setItem(i, { ...it, [f.key]: v })}
                />
              )
            }
            if (f.type === 'select') {
              return (
                <div className="admin-field" key={f.key}>
                  <label>{f.label}</label>
                  <select
                    className="admin-input"
                    value={it[f.key]}
                    onChange={(e) => setItem(i, { ...it, [f.key]: e.target.value })}
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              )
            }
            return (
              <TextField
                key={f.key}
                label={f.label}
                value={it[f.key]}
                onChange={(v) => setItem(i, { ...it, [f.key]: v })}
                textarea={f.type === 'textarea'}
                type={f.type === 'number' ? 'number' : 'text'}
              />
            )
          })}
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn--small" onClick={() => onChange([...items, structuredClone(template)])}>
        + 添加条目
      </button>
    </div>
  )
}

function SectionForm({ schema, data, onChange }) {
  const setField = (key, value) => onChange({ ...data, [key]: value })
  return (
    <>
      {schema.map((f) => {
        if (f.type === 'strList') {
          return (
            <StrListEditor
              key={f.key}
              label={f.label}
              items={data[f.key] || []}
              onChange={(v) => setField(f.key, v)}
            />
          )
        }
        if (f.type === 'objList') {
          return (
            <ObjListEditor
              key={f.key}
              label={f.label}
              items={data[f.key] || []}
              itemFields={f.itemFields}
              template={f.template}
              onChange={(v) => setField(f.key, v)}
            />
          )
        }
        if (f.type === 'object') {
          return (
            <ObjectEditor
              key={f.key}
              label={f.label}
              fields={f.fields}
              value={data[f.key] || {}}
              onChange={(v) => setField(f.key, v)}
            />
          )
        }
        return (
          <TextField
            key={f.key}
            label={f.label}
            value={data[f.key]}
            onChange={(v) => setField(f.key, v)}
            textarea={f.type === 'textarea'}
          />
        )
      })}
    </>
  )
}

function LoginGate({ onUnlock }) {
  const [cfg, setCfg] = useState(undefined) // undefined=加载中 null=未配置密码
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    loadSecurityConfig().then((c) => {
      setCfg(c)
      if (!c) onUnlock()
    })
  }, [onUnlock])

  const submit = async (e) => {
    e.preventDefault()
    if (await verifyPassword(pwd, cfg)) {
      sessionStorage.setItem(ADMIN_OK, '1')
      onUnlock()
    } else {
      setErr('密码不正确')
    }
  }

  return (
    <div className="admin-root">
      <form className="admin-login admin-card" onSubmit={submit}>
        <h3>内容管理后台</h3>
        <p className="admin-hint">请输入管理密码</p>
        <div className="admin-field">
          <input
            className="admin-input"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
          />
        </div>
        {err && <p className="admin-hint admin-hint--err">{err}</p>}
        <button className="admin-btn admin-btn--primary" type="submit">
          进入后台
        </button>
        <a className="admin-backlink" href="#top">← 回到站点</a>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(ADMIN_OK) === '1')
  const [tab, setTab] = useState(CONTENT_FILES[1].key)
  const [draft, setDraft] = useState(initialDraft)
  const [gh, setGh] = useState(() => {
    const remember = localStorage.getItem(GH_REMEMBER) === '1'
    const token = remember ? localStorage.getItem(GH_TOKEN) : sessionStorage.getItem(GH_TOKEN)
    const branch = localStorage.getItem(GH_BRANCH) || 'main'
    return { token: token || '', remember, branch }
  })
  const [secCfgLoaded, setSecCfgLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // { ok, text }

  useEffect(() => {
    document.title = 'cmchen · 内容后台'
    loadSecurityConfig().then((c) => {
      setSecCfgLoaded(c !== null)
    })
    return () => {
      document.title = 'cmchen'
    }
  }, [])

  const setGhField = (patch) => {
    setGh((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem(GH_REMEMBER, next.remember ? '1' : '0')
      localStorage.setItem(GH_BRANCH, next.branch || 'main')
      if (next.remember) {
        localStorage.setItem(GH_TOKEN, next.token)
        sessionStorage.removeItem(GH_TOKEN)
      } else {
        sessionStorage.setItem(GH_TOKEN, next.token)
        localStorage.removeItem(GH_TOKEN)
      }
      return next
    })
  }

  const setSection = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const run = async (fn) => {
    if (busy) return
    setBusy(true)
    setStatus(null)
    try {
      await fn()
    } catch (e) {
      setStatus({ ok: false, text: `操作失败：${e.message}` })
    } finally {
      setBusy(false)
    }
  }

  const requireToken = () => {
    if (!gh.token) {
      setStatus({ ok: false, text: '请先在「GitHub 连接」里填写并保存访问令牌' })
      return false
    }
    return true
  }

  const saveSection = (key) =>
    run(async () => {
      if (!requireToken()) return
      const file = CONTENT_FILES.find((f) => f.key === key)
      await writeFile(
        file.path,
        JSON.stringify(draft[key], null, 2) + '\n',
        `content: update ${key}`,
        gh.token,
        gh.branch
      )
      setStatus({
        ok: true,
        text: `已提交 ${file.path} 到 ${gh.branch} 分支，站点约 1-2 分钟后自动重建上线`,
      })
    })

  const pullLatest = () =>
    run(async () => {
      if (!requireToken()) return
      const next = {}
      let pulled = 0
      for (const file of CONTENT_FILES) {
        try {
          const { text } = await readFile(file.path, gh.token, gh.branch)
          next[file.key] = JSON.parse(text)
          pulled += 1
        } catch (e) {
          if (e.status !== 404) throw e
          next[file.key] = draft[file.key] // 新文件尚未提交过，保留当前
        }
      }
      setDraft((d) => ({ ...d, ...next }))
      setStatus({ ok: true, text: `已从 GitHub 拉取 ${pulled} 个内容文件的最新版本` })
    })

  const onTestConnection = () =>
    run(async () => {
      const r = await testConnection(gh.token)
      setStatus({ ok: r.ok, text: r.message })
    })

  const changePassword = (newPwd, confirmPwd) =>
    run(async () => {
      if (!requireToken()) return
      if (!newPwd || newPwd.length < 6) {
        setStatus({ ok: false, text: '新密码至少 6 位' })
        return
      }
      if (newPwd !== confirmPwd) {
        setStatus({ ok: false, text: '两次输入的密码不一致' })
        return
      }
      const cfg = await makeSecurityConfig(newPwd)
      await writeFile(
        ADMIN_SECURITY_PATH,
        JSON.stringify(cfg, null, 2) + '\n',
        'admin: update password hash',
        gh.token,
        gh.branch
      )
      setSecCfgLoaded(true)
      setStatus({
        ok: true,
        text: '密码已更新并提交（下次部署后生效，请牢记新密码）',
      })
    })

  if (!unlocked) return <LoginGate onUnlock={() => setUnlocked(true)} />

  const isContentTab = CONTENT_FILES.some((f) => f.key === tab)
  const currentFile = CONTENT_FILES.find((f) => f.key === tab)

  return (
    <div className="admin-root">
      <header className="admin-top">
        <div className="admin-title">
          cmchen 内容后台
          <small>改动提交到 GitHub 后站点自动重建</small>
        </div>
        <span className="admin-top-spacer" />
        <a className="admin-link" href="#top">查看站点</a>
        <button
          type="button"
          className="admin-link"
          onClick={() => {
            sessionStorage.removeItem(ADMIN_OK)
            setUnlocked(false)
          }}
        >
          锁定后台
        </button>
      </header>

      <div className="admin-body">
        <nav className="admin-tabs" aria-label="内容分区">
          {CONTENT_FILES.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`admin-tab${tab === f.key ? ' is-active' : ''}`}
              onClick={() => {
                setTab(f.key)
                setStatus(null)
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            className={`admin-tab${tab === 'connection' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('connection')
              setStatus(null)
            }}
          >
            GitHub 连接
          </button>
          <button
            type="button"
            className={`admin-tab${tab === 'security' ? ' is-active' : ''}`}
            onClick={() => {
              setTab('security')
              setStatus(null)
            }}
          >
            安全
          </button>
        </nav>

        <main className="admin-panel">
          {isContentTab && (
            <div className="admin-card">
              <h3>{currentFile.label}</h3>
              <p className="admin-hint">编辑后点「保存并提交」，提交路径 {currentFile.path}</p>
              <SectionForm
                schema={SCHEMAS[tab]}
                data={draft[tab]}
                onChange={(v) => setSection(tab, v)}
              />
              <div className="admin-toolbar">
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={busy}
                  onClick={() => saveSection(tab)}
                >
                  保存并提交
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  disabled={busy}
                  onClick={pullLatest}
                >
                  从 GitHub 拉取最新
                </button>
              </div>
            </div>
          )}

          {tab === 'connection' && (
            <div className="admin-card">
              <h3>GitHub 连接</h3>
              <p className="admin-hint">
                需要具有 repo 权限的 Personal Access Token（GitHub → Settings →
                Developer settings → Tokens）。令牌只存在你自己的浏览器里。
              </p>
              <div className="admin-field">
                <label>访问令牌（PAT）</label>
                <input
                  className="admin-input"
                  type="password"
                  value={gh.token}
                  onChange={(e) => setGhField({ token: e.target.value })}
                  placeholder="ghp_… / github_pat_…"
                />
              </div>
              <div className="admin-field">
                <label>提交分支</label>
                <input
                  className="admin-input"
                  type="text"
                  value={gh.branch}
                  onChange={(e) => setGhField({ branch: e.target.value })}
                />
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={gh.remember}
                  onChange={(e) => setGhField({ remember: e.target.checked })}
                />
                记住令牌（不勾选则关闭标签页即失效）
              </label>
              <div className="admin-toolbar">
                <button
                  type="button"
                  className="admin-btn"
                  disabled={busy}
                  onClick={onTestConnection}
                >
                  测试连接
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <SecurityPanel hasPassword={secCfgLoaded} busy={busy} onChangePassword={changePassword} />
          )}

          {status && (
            <div className={`admin-status${status.ok ? ' ok' : ' err'}`}>{status.text}</div>
          )}
        </main>
      </div>
    </div>
  )
}

function SecurityPanel({ hasPassword, busy, onChangePassword }) {
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  return (
    <div className="admin-card">
      <h3>安全</h3>
      <p className="admin-hint">
        {hasPassword
          ? '当前已设置管理密码。修改后会提交到仓库，下次部署生效。'
          : '当前未设置管理密码（任何人都能进入后台），建议立即设置。'}
      </p>
      <div className="admin-field">
        <label>新密码（至少 6 位）</label>
        <input
          className="admin-input"
          type="password"
          value={pwd1}
          onChange={(e) => setPwd1(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <label>确认新密码</label>
        <input
          className="admin-input"
          type="password"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
        />
      </div>
      <div className="admin-toolbar">
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={busy}
          onClick={() => {
            onChangePassword(pwd1, pwd2)
            setPwd1('')
            setPwd2('')
          }}
        >
          更新密码
        </button>
      </div>
    </div>
  )
}
