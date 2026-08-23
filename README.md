# cmchen · 个人主页

深空主题的个人作品集网站 —— 单文件片段着色器渲染的星云、星空与流星背景，配合瑞士报刊式的排版与克制的入场编排。内容全部外置为 JSON，内置一个挂在 `#/admin` 的可视化后台，改完提交到 GitHub 即自动重新部署。

**在线访问**：<https://shi-tou1234.github.io/cmchen-page/>

![preview](public/og-image.png)

## 特性

- **深空背景（原生 WebGL）**：一个 433 行的片段着色器完成全部渲染——fbm/ridge 噪声星云、三层视差星空、错峰流星、顶部极光缎带、鼠标光晕与滚动镜头推进；`prefers-reduced-motion` 时降为单帧静态渲染
- **编辑部式排版（v2）**：固定竖向发丝网格、区块幽灵水印字、Hero 报头信息行、导航滚动进度线与 scroll-spy 高亮、项目卡悬停光弧描边（`@property --trace-angle` 动画）
- **内容即数据**：十个分区（站点/首页/关于/竞赛/技能/项目/统计/联系/博客/滚动条）的文案全部在 `src/data/content/*.json`，改 JSON 不碰组件
- **可视化后台**：`#/admin` 表单化编辑 + 保存即提交 GitHub（Contents API），带 SHA 冲突自动重试、未保存提醒、并行拉取
- **运行时数据**：GitHub 开源项目数在构建时快照 + 运行时刷新（失败保底不闪错）；博客最新文章运行时抓取，带 10 分钟本地缓存与 8 秒超时
- **安全加固**：后台 PBKDF2 密码门 fail-closed、富文本白名单消毒、GitHub API 仅允许 `api.github.com`、拒绝内网地址
- **性能**：懒加载后台 chunk、滚动进度直写 style 避免重渲染、光标光晕空闲自停、卡片交互缓存矩形、`package-lock` 锁定依赖

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | React 19 + Vite 8 |
| 背景 | 原生 WebGL 片段着色器（无 three.js 依赖，主包 gzip ≈ 75 kB） |
| 字体 | @fontsource/noto-sans-sc（按 unicode-range 分片按需加载） |
| 动效 | 纯 CSS（Scroll Reveal / 字符上升 / 打字机 / 数字滚动 / 磁吸按钮） |
| 检查 | oxlint |
| 部署 | GitHub Actions → GitHub Pages |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173 会自动跳转到 /cmchen-page/
```

Windows 双击 `start.bat` 一键启动（首次自动安装依赖并打开浏览器）。

其他命令：

```bash
npm run lint       # oxlint 检查
npm run build      # 拉取 GitHub 快照 + 产出 dist/
npm run preview    # 本地预览构建结果
```

> **被 TLS 拦截代理的网络环境**：构建前的 GitHub 快照拉取可能失败，脚本会保留上一次的有效值并继续构建（页面运行时会再刷新一次）。必要时可设 `GH_INSECURE_TLS=1` 放宽校验（仅建议本地开发使用）。CI 环境会自动使用 Actions 提供的 `GITHUB_TOKEN`。

## 目录结构

```
├── index.html                  # 入口 HTML（og/twitter 分享 meta）
├── public/
│   ├── admin-security.json     # 后台密码的 PBKDF2 哈希配置
│   ├── og-image.png            # 社交分享图（脚本生成）
│   └── favicon.svg
├── scripts/
│   ├── fetch-github.mjs        # 构建前拉取开源项目数快照（prebuild）
│   ├── gen-admin-hash.mjs      # 生成/重置后台密码哈希
│   └── gen-og-image.mjs        # 零依赖生成 og-image.png
├── src/
│   ├── App.jsx                 # hash 路由：#/admin ↔ 前台
│   ├── main.jsx / index.css
│   ├── admin/                  # 后台（懒加载 chunk）
│   │   ├── AdminApp.jsx        # 表单编辑器 + 登录门
│   │   ├── files.js            # 内容文件注册表（新增分区先在这里登记）
│   │   ├── github.js           # GitHub Contents API 客户端
│   │   └── security.js         # PBKDF2 校验（fail-closed）
│   ├── components/             # 前台组件（含 NebulaBackground 背景着色器）
│   ├── data/content/*.json     # 全部站点文案（后台可编辑）
│   └── lib/                    # toast / clipboard / HTML 白名单消毒
└── .github/workflows/deploy.yml
```

## 内容编辑

### 方式一：直接改 JSON

编辑 `src/data/content/*.json` 后提交，站点自动重建。关于区 `intro` 字段支持极有限的 HTML（`<em> <strong> <b> <i> <br>`），渲染前会经白名单消毒，其余标签一律剥除。

### 方式二：后台（推荐日常使用）

访问 `https://…/cmchen-page/#/admin`，输入管理密码进入。

1. **GitHub 连接**：填入 Personal Access Token。建议使用 fine-grained token，只勾选本仓库的 *Contents: Read and write* —— 即使令牌泄露，影响面也只限内容文件。令牌只存在你自己的浏览器里（勾选"记住"才落 localStorage）
2. **编辑**：左侧选分区，表单化修改；「从 GitHub 拉取最新」可并行同步远端十个文件
3. **保存**：「保存并提交」直接推送到指定分支，Pages 约 1–2 分钟后自动重建上线；顶栏出现「● 未保存」时关闭页面会收到提醒
4. **改密码**：安全页可更新密码（需 token）；也可本地执行 `node scripts/gen-admin-hash.mjs <新密码>` 重写 `public/admin-security.json` 后提交

> 密码锁是后台的门槛而非站点的防线：真正阻止未授权写入的是 GitHub Token 权限。密码配置加载失败时后台会拒绝放行而不是敞开大门。

## 部署

推送到 `main` 分支后 GitHub Actions 自动构建并发布到 GitHub Pages（`.github/workflows/deploy.yml`）。

- 站点构建在仓库 Pages 子路径下，`vite.config.js` 中 `base: '/cmchen-page/'` 与之对应；换仓库名时记得同步修改
- 分享卡片：`og:image` 指向 `public/og-image.png`，运行 `node scripts/gen-og-image.mjs` 可重新生成（确定性种子，结果可复现）
- 运行时抓取博客文章依赖博客站与主页**同源**（当前同为 `shi-tou1234.github.io`）；若博客日后绑定自定义域名，需在博客端补 CORS 响应头，否则主页会显示兜底文案

## 设计与无障碍

- 全站遵循 `prefers-reduced-motion`：背景单帧渲染、入场动画即时完成、跑马灯停转、光标光晕隐藏
- 键盘焦点可见（`focus-visible` 描边），交互元素均有 `aria-label`，装饰性元素 `aria-hidden`
- 背景亮度以"克制偏暗"为基准调校；移动端隐藏竖向网格与水印，统计条自适应列数

## License

MIT
