# cmchen · 个人主页

深空主题的个人作品集网站 —— 单文件片段着色器渲染的星云、星空与流星背景，配合瑞士报刊式排版、电影级入场编排与沉浸式滚动交互。内容全部外置为 JSON，内置 `#/admin` 可视化后台，改完提交到 GitHub 即自动重新部署。

**在线访问**：<https://shi-tou1234.github.io/cmchen-page/>

![preview](public/og-image.png)

## 特性

### 视觉与交互

- **深空背景（原生 WebGL）**：433 行片段着色器完成全部渲染——fbm/ridge 噪声星云、三层视差星空、错峰流星、极光缎带、鼠标光晕与滚动镜头推进；`prefers-reduced-motion` 时降为单帧静态
- **Preloader 电影开场**：4 阶段编排——logo 逐字打出 → 蓝晕发光脉冲 → 副标题淡入 → 遮罩揭幕星云（2.2s，减少动效秒进）
- **巨型 Hero**：名字占满全宽（18.5vw），第 3/6 字符常驻描边、悬停实心↔描边互换；弹性过冲入场（`char-bounce`）+ 逐字滚动飘散
- **横向项目画廊**：sticky 钉住 + 滚动进度推轨 + 焦点卡深度效果（远离中线的卡缩小变暗），底部 `01/04` 计数器 + 进度发丝线
- **自定义光标**：白点即时 + 细环滞后追踪（0.16 lerp），悬停可交互元素时环放大变色；系统箭头仅在组件挂载时隐藏（`#/admin` 不受影响）
- **滚动色温旅程**：`@property` 驱动 `--accent`/`--accent-2` 过渡，7 个区块各有独立色温（蓝→青→紫→蓝紫→蓝→蓝→暖金），导航/进度条/芯片全站跟着变
- **滚动视差深度层**：ghost 水印以 section-relative 方式漂移（±150px），制造景深
- **平滑滚动 lerp 层**：rAF 插值循环让所有滚动驱动效果（视差/Hero 淡出/逐字飘散）共享有"重量感"的插值源
- **荣誉殿堂**：竞赛区从行级表格改为居中大字排版——年份巨型水印 + 奖项名称 + 发光 badge
- **导航滑动指示器**：2px 渐变短线在当前区块链接下方平滑滑动
- **技能行 / 事实行级联入场**：Reveal 触发后逐行 70–90ms 错峰浮现
- **项目封面呼吸**：hover 时饱和度+亮度微脉冲（`saturate(1→1.35) brightness(1→1.06)`）
- **About 荧光笔**：细条下划线式高亮（替代整块填充，减少"误选中"观感）
- **词轮换渐隐**：WordRotator 上下边缘 mask 渐隐，避免硬裁切

### 内容与后台

- **内容即数据**：十个分区的文案全部在 `src/data/content/*.json`，改 JSON 不碰组件
- **可视化后台**：`#/admin` 表单化编辑 + 保存即提交 GitHub（Contents API），带 SHA 冲突自动重试、未保存提醒
- **运行时数据**：GitHub 开源项目数构建时快照 + 运行时刷新；博客最新文章运行时抓取（10 分钟缓存 + 8 秒超时）
- **安全加固**：后台 PBKDF2 密码门 fail-closed、富文本白名单消毒、GitHub API 仅允许 `api.github.com`

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | React 19 + Vite 8 |
| 背景 | 原生 WebGL 片段着色器（无 three.js，主包 gzip ≈ 77 kB） |
| 字体 | @fontsource/noto-sans-sc + @fontsource/jetbrains-mono（按 unicode-range 分片按需加载） |
| 动效 | 纯 CSS + rAF（弹性缓动 / clip-path / @property 过渡 / IntersectionObserver 级联 / lerp 平滑滚动） |
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

> **被 TLS 拦截代理的网络环境**：构建前的 GitHub 快照拉取可能失败，脚本会保留上一次的有效值并继续构建（页面运行时会再刷新一次）。必要时可设 `GH_INSECURE_TLS=1` 放宽校验（仅建议本地开发使用）。

## 目录结构

```
├── index.html                  # 入口 HTML（og/twitter 分享 meta）
├── public/
│   ├── admin-security.json     # 后台密码的 PBKDF2 哈希配置
│   ├── og-image.png            # 社交分享图
│   └── favicon.svg
├── scripts/
│   ├── fetch-github.mjs        # 构建前拉取开源项目数快照（prebuild）
│   └── gen-admin-hash.mjs      # 生成/重置后台密码哈希
├── src/
│   ├── App.jsx                 # hash 路由 + 共享 scroll lerp + 色温切换
│   ├── main.jsx / index.css
│   ├── admin/                  # 后台（懒加载 chunk）
│   ├── components/             # 前台组件（含 NebulaBackground 着色器）
│   ├── data/content/*.json     # 全部站点文案（后台可编辑）
│   └── lib/                    # toast / clipboard / HTML 白名单消毒
└── .github/workflows/deploy.yml
```

## 内容编辑

### 方式一：直接改 JSON

编辑 `src/data/content/*.json` 后提交，站点自动重建。关于区 `intro` 字段支持极有限的 HTML（`<em> <strong> <b> <i> <br>`），渲染前会经白名单消毒。

### 方式二：后台（推荐日常使用）

访问 `https://…/cmchen-page/#/admin`，输入管理密码进入。

1. **GitHub 连接**：填入 Personal Access Token（fine-grained，仅勾选本仓库 Contents: Read and write）
2. **编辑**：左侧选分区，表单化修改
3. **保存**：「保存并提交」推送到分支，Pages 约 1–2 分钟后自动重建
4. **改密码**：安全页更新 或 本地 `node scripts/gen-admin-hash.mjs <新密码>`

## 部署

推送到 `main` 分支后 GitHub Actions 自动构建并发布到 GitHub Pages。

- `vite.config.js` 中 `base: '/cmchen-page/'` 与 Pages 子路径对应
- 运行时抓取博客文章依赖博客站与主页同源；若博客绑定自定义域名需补 CORS

## 设计与无障碍

- 全站遵循 `prefers-reduced-motion`：背景单帧、入场即时、跑马灯停转、光标隐藏、色温不切换
- 键盘焦点可见（`focus-visible` 描边），交互元素 `aria-label`，装饰元素 `aria-hidden`
- 背景亮度以"克制偏暗"为基准；移动端隐藏竖向网格与水印

## License

MIT
