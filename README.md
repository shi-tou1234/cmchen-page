# cmchen · 个人主页

深空主题的个人作品集网站 —— 单文件片段着色器渲染的星云、星空与流星背景，配合瑞士报刊式排版与电影级滚动编排：从 Preloader 开场、巨型 Hero、到 About 逐字点亮与 Footer 巨型 wordmark 落幕，每一屏都有专属的编排时刻。内容全部外置为 JSON，内置 `#/admin` 可视化后台，改完提交到 GitHub 即自动重新部署。

**在线访问**：<https://shi-tou1234.github.io/cmchen-page/>

![preview](public/og-image.png)

## 特性

### 视觉与交互

**开场与全局运动系统**

- **深空背景（原生 WebGL）**：433 行片段着色器完成全部渲染——fbm/ridge 噪声星云、三层视差星空、错峰流星、极光缎带、鼠标光晕与滚动镜头推进；`prefers-reduced-motion` 时降为单帧静态
- **Preloader 电影开场**：4 阶段编排——logo 逐字打出 → 蓝晕发光脉冲 → 副标题淡入 → 遮罩揭幕星云（2.2s，减少动效秒进）
- **平滑滚动 lerp 层**：rAF 插值循环让所有滚动驱动效果共享有"重量感"的插值源；lerp 层同时输出速度信号（`--scroll-vel`），快滚时全站运动带速度反馈
- **滚动色温旅程**：`@property` 驱动 `--accent`/`--accent-2` 过渡，7 个区块各有独立色温（蓝→青→紫→蓝紫→蓝→蓝→暖金），导航/进度条/芯片全站跟着变
- **自定义光标**：白点即时 + 细环滞后追踪（0.16 lerp），悬停可交互元素时环放大变色；系统箭头仅在组件挂载时隐藏（`#/admin` 不受影响）
- **滚动视差深度层**：ghost 水印以 section-relative 方式漂移（±150px），制造景深

**各屏编排**

- **巨型 Hero**：名字占满全宽（18.5vw），第 3/6 字符常驻描边、悬停实心↔描边互换；弹性过冲入场 + 滚出时逐字按不同速率飘散
- **跑马灯速度斜切**：滚动越快字带越倾斜（skewX，峰值约 12°），停手回正——水平边线不变形
- **About 大字逐字点亮**：滚动经过时宣言逐字从暗擦洗到亮，`<em>` 强调段点亮时荧光笔下划线同步显出；rAF 仅在段落进入视口邻域时驱动
- **Awards 荣誉名录**：编辑式索引行（编号/年份/奖名/组别/徽章），悬停联动——活动行提亮左移、其余退后，背景巨型年份水印随悬停切换
- **Skills 动能榜**：瑞士表格风——熟练轨进场画入、评分数字 odometer 滚动（数据含 `score` 时）、光标接近时整列行如铁屑趋磁般剪切反应、悬停整行反白
- **横向项目画廊**：sticky 钉住 + 滚动进度推轨 + 焦点卡深度效果（远离中线的卡缩小变暗），底部 `01/04` 计数器 + 进度发丝线
- **Blog 大字行**：运行时抓取最新文章，标题与 mono 小字构成大小对比，悬停编号变主题色
- **Contact 终章**：巨型 email 描边跑马灯带（悬停停住填充实心、点击复制）+ 磁吸主按钮 + 实时时钟 + 呼吸状态点
- **Footer wordmark 落幕**：巨型站名（后台可编辑）即「回到顶部」按钮，悬停字距松开、句点点亮
- **标题逐字入场统一**：五个区块标题全部 SplitText 逐字入场；导航滑动指示器在当前区块链接下滑动

### 内容与后台

- **内容即数据**：十个分区的文案全部在 `src/data/content/*.json`，改 JSON 不碰组件；Skills 支持可选 `score` 字段（缺失时轨长按档位映射）
- **可视化后台**：`#/admin` 表单化编辑 + 保存即提交 GitHub（Contents API），带 SHA 冲突自动重试、未保存提醒
- **运行时数据**：GitHub 开源项目数构建时快照 + 运行时刷新；博客最新文章运行时抓取（10 分钟缓存 + 8 秒超时）
- **安全加固**：后台 PBKDF2 密码门 fail-closed；About 富文本按结构化解析渲染（仅 em/strong/b/i/br，不注入原始 HTML）；GitHub API 仅允许 `api.github.com`

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | React 19 + Vite 8 |
| 背景 | 原生 WebGL 片段着色器（无 three.js，主包 gzip ≈ 80 kB） |
| 字体 | @fontsource/noto-sans-sc + @fontsource/jetbrains-mono（按 unicode-range 分片按需加载） |
| 动效 | 纯 CSS + rAF（弹性缓动 / clip-path / @property 过渡 / IntersectionObserver 级联 / lerp 平滑滚动 / scroll-scrub） |
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
│   ├── App.jsx                 # hash 路由 + 共享 scroll lerp/速度信号 + 色温切换
│   ├── main.jsx / index.css
│   ├── admin/                  # 后台（懒加载 chunk）
│   ├── components/             # 前台组件（含 NebulaBackground 着色器）
│   ├── data/content/*.json     # 全部站点文案（后台可编辑）
│   └── lib/                    # toast / clipboard / HTML 白名单消毒
└── .github/workflows/deploy.yml
```

## 内容编辑

### 方式一：直接改 JSON

编辑 `src/data/content/*.json` 后提交，站点自动重建。关于区 `intro` 字段支持极有限的标签（`<em> <strong> <b> <i> <br>`），前台按结构化解析渲染，不会注入原始 HTML。

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

- 全站遵循 `prefers-reduced-motion`：背景单帧、入场即时、跑马灯停转、斜切/剪切/擦洗归零、光标隐藏、色温不切换
- 键盘焦点可见（`focus-visible` 描边），交互元素 `aria-label`，装饰元素 `aria-hidden`
- 背景亮度以"克制偏暗"为基准；移动端（≤768px）所有新效果均有降级路径，触屏设备禁用悬停依赖交互
- 悬停联动类效果（Awards 行、Skills 剪切、Contact 磁吸）均以 `(hover: hover)` / `(pointer: fine)` 门控，触屏自动退化为静态等亮排版

## License

MIT
