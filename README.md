# cmchen · 个人主页

实拍影像驱动的个人作品集网站 —— 五段夜景视频按栏目接力成为连续背景、栏目交界让真实视频帧动态溶解，滚动编排参考 [eladiodieste.com](https://www.eladiodieste.com/)；动效叙事方法论取自 [feitangyuan/onetake](https://github.com/feitangyuan/onetake)（一镜到底：节拍互相生长而非各自换片）。暗夜放映室基调：深蓝夜空、衬线巨字、香槟金色温。内容全部外置为 JSON，内置 `#/admin` 可视化后台，改完提交到 GitHub 即自动重新部署。

**在线访问**：<https://shi-tou1234.github.io/cmchen-page/>

![preview](public/og-image.png)

## 特性

### 动效叙事系统

- **曲线三族**：全站不再共用一条缓动——`--ease-snap`（入场急停，t80≈.23）/`--ease-spring`（回弹过冲）/`--ease-settle`（大位移缓落）按语义分配；每个区块的 burst / rest / cascade 段性与错位时长写死在 [PROGRESS.md](PROGRESS.md) 的节拍表里
- **边界承载（carry）**：7 个区块交界处有「活过去的元素」——下一节的幽灵水印字放大 1.07×、半透明从上一节散场中浮出、落位中线归位；全宽发丝线展开后，区块头的金线从同一侧接着长出来
- **滚动运镜**：内容层随滚动推近（进场 0.96→1 ＋26px 升沉、出场 1.03 推离），全部挂在 App.jsx 共享 lerp 层（`window.__smoothY`）上；**阅读区完全静止**（rests are what make bursts land），只写 transform/opacity 并带「值未变不写」哨兵，合成层按临近视口动态升降级
- **粒子尘埃**：19 颗（基线 60%）、静止约 1s 内完全冻结、快滚时沿真实运动方向拉出细痕——小元素大地面，永动反被戒掉
- **Preloader 电影开场**：logo 逐字打出 → 遮罩揭幕 → Hero 巨字弹入（2.2s，**每次刷新完整播放**，减少动效秒进）
- **跑道式 Hero**：192svh 跑道 ＋ sticky 舞台，滚轮驱动内容层下沉/缩放/逐字散隐；名字巨字第 3/6 字符常驻描边；鼠标靠近字符被斥力推开再回弹
- **按钮人格**：hero 按钮对为「硬阴影实体键」——常驻右下香槟金硬阴影，悬停整体滑向左上、阴影加深、按压压进阴影；GITHUB 按钮悬停时两枚边角括号弹拢

### 各屏编排

- **关于**：宣言大字随滚动逐字点亮（rAF 邻域驱动），`<em>` 强调段点亮时金线同步划出；右侧事实卡弹簧入场、驻留卡随行错位画入
- **竞赛**：编辑式索引行——活动行提亮、其余退后，行批量 snap 连击入场（60ms 错位，全页最快）；背景巨型年份水印随悬停切换、settle 重生
- **技能**：瑞士表格动能榜——整组 spring 一次到位（不逐个报数），熟练轨按行错位画入，评分数字 odometer 滚动；光标接近时整列行如铁屑趋磁般反向剪切；悬停整行反白
- **项目**：纵向交错 Z 字网格（回归原生竖向滚动，弃用横向推轨）——左列 snap／右列 spring 交错 90ms；卡片 Tilt 微倾斜、封面色球 spring 呼吸、圆钮箭头悬停转向；每卡主题色来自后台 JSON
- **博客**：博客关于页同款引语 ＋ 最新文章索引（settle 长错位入场）＋ 旅行足迹地图（ECharts 中国地图，进视口才动态加载；全国视图点亮省份，点击下钻省市视图，侧栏城市支持搜索）
- **联系**：巨型 email 描边跑马灯带（点击复制）＋ 硬阴影错位主按钮 ＋ GITHUB 括号聚拢版 ＋ 实时时钟
- **落幕**：footer 巨型站名即「回到顶部」——渐变逐字裁剪（字母动渐变跟着动），整词悬停从左到右波浪抬升、单字深跳提亮
- **全局**：跑马灯速度斜切（`--scroll-vel` 驱动，停手回正）、导航滑动指示器、滚动色温旅程（7 区块暖色同族微差）、`#/copy` 整页安静排版副本

### 背景影像系统

- **五段实拍视频接力**（1600×900、24fps、无音轨、全关键帧编码；`nlmeans` 降噪、`delogo` 水印清理、轻度锐化）：

| 栏目 | 背景视频 | 交界处理 |
|------|----------|----------|
| Hero / 首屏 | 星空星轨微尘 | 尾帧 → 雪山流星竞赛首帧 |
| 关于 · 竞赛 | 雪山流星竞赛 | 与竞赛同轨 |
| 竞赛 | 雪山流星竞赛 | 尾帧 → 静谧月夜河流首帧 |
| 技能 | 静谧月夜河流 | 与项目同轨（行程 3900px，刮擦缓） |
| 项目 | 静谧月夜河流 | 尾帧 → 银河云海项目首帧 |
| 博客（含地图） | 银河云海项目 | 尾帧 → 静谧月夜山溪首帧 |
| 联系 · 页脚 | 静谧月夜山溪 | — |

- **混合播放驱动**：每条轨道把滚动进度映射到原视频 `0 → 结尾`（不 ping-pong）；滚动时纯 seek 刮擦，静止 650ms 后当前段以 **1× 原速自动播放**（24fps 原生送帧，不慢放）——两态交接时播放头差记为一次性 **drift** 随滚动平滑衰减归零（修掉「滚轮一动背景就往回跳一下」）；seek 在途不重启解码
- **换场溶解**：栏目交界约 0.46 屏窗口内两条真实视频继续运动并交叉溶解（CSS 恒速，与滚动速度解耦）；尾/首关键帧兼作减少动效静帧锚点与加载兜底

### 内容与后台

- **内容即数据**：十一份 JSON 全部在 `src/data/content/*.json`（含 `backgrounds.json` 视频映射），改 JSON 不碰组件
- **可视化后台**：`#/admin` 表单化编辑 ＋ 保存即提交 GitHub（Contents API），带 SHA 冲突重试、未保存提醒；密码门 PBKDF2 fail-closed
- **旅行数据与博客同源**：`scripts/fetch-travel.mjs` 在 dev/build 前从博客仓库 `about-personal.ts` 提取 58 城写入快照（`src/data/generated/travel.json`）——博客改足迹、主页下次构建自动跟上；GitHub raw → 本机相邻博客仓库 → 上次快照，三级回退绝不空窗
- **运行时数据**：GitHub 开源项目数（构建时快照 ＋ 运行时刷新，失败保留旧值）；博客最新文章（10 分钟 localStorage 缓存 ＋ 8 秒超时）
- **安全加固**：About 富文本按结构化解析渲染（仅 em/strong/b/i/br，不注入原始 HTML）；GitHub API 仅允许 `api.github.com`

## 技术栈

| 层 | 选择 |
|----|------|
| 框架 | React 19 ＋ Vite 8（hash 路由，Pages 子路径 `/cmchen-page/`） |
| 背景 | 五段实拍视频（全关键帧 mp4）＋ 轨道滚动映射 ＋ 刮擦/自动播放混合驱动 ＋ 尾/首帧溶解，rAF 同步 |
| 地图 | ECharts 按需分包（`echarts/core` ＋ MapChart，进视口才加载），边界资源本地自持（`public/maps`） |
| 字体 | Cormorant Garamond（拉丁巨字/数字）＋ 思源宋体可变字重（中文标题）＋ 思源黑体可变字重（正文）＋ JetBrains Mono（编号/meta），全部 @fontsource 本地打包 |
| 动效 | 纯 CSS ＋ rAF（曲线三族 / clip-path / @property 过渡 / IntersectionObserver 级联 / lerp 平滑滚动 / scroll-scrub） |
| 检查 | oxlint |
| 部署 | GitHub Actions → GitHub Pages |

## 快速开始

```bash
npm install
npm run dev        # 端口被占时 vite 自动顺延；base 为 /cmchen-page/
```

`predev` 会先同步一次旅行数据快照（失败自动回退，不阻塞启动）。Windows 双击 `start.bat` 一键启动（首次自动安装依赖并打开浏览器）。

```bash
npm run lint       # oxlint 检查
npm run build      # 拉取 GitHub 数 ＋ 旅行数据快照 ＋ 产出 dist/
npm run preview    # 本地预览构建结果
```

> **被 TLS 拦截代理的网络环境**：构建前的快照拉取可能失败，脚本依次回退到本机相邻博客仓库与上次有效快照，构建继续。必要时可设 `GH_INSECURE_TLS=1` 放宽校验（仅建议本地开发使用）。

## 验收探针

`shots/` 下是本仓库的取证工具链——动效这类「机器判不了手感」的东西靠可复跑的数字盯住（先 `npm run preview`，浏览器用本机 Edge）：

| 脚本 | 作用 | 合格线 |
|------|------|--------|
| `capture.mjs` | 八个区块终态分段截图（`?static=1` 冻结动画直出终态） | 8 张 PNG 产出 |
| `capture-boundary.mjs` | 七个区块边界中点截图 ＋ 交接元素数值证据 | ghost 缩放差 Δ≥0.07、相机 0.979→1 |
| `probe-motion.mjs` | reduced-motion 脏写入检查 ＋ 10s 滚动帧率采样 | 脏写入=[]、p95<16.7ms |
| `probe-scrub.mjs` | idle 自动播放与滚动刮擦交接的播放头回跳 | backwardJumps=0 |
| `probe-bg.mjs` | 逐段读背景主导视频与溶解窗 | 与映射表一致、段中心 veil=0 |
| `probe-intro.mjs` | 同一会话连刷两次的开场编排 | 两次 preloader 均在 DOM |

## 目录结构

```
├── index.html                  # 入口 HTML（og/twitter 分享 meta）
├── start.bat                   # Windows 一键启动
├── public/
│   ├── admin-security.json     # 后台密码的 PBKDF2 哈希配置
│   ├── maps/                   # 中国地图边界（china.full.json ＋ 34 省份，拷贝自博客站点）
│   ├── videos/                 # 五段背景视频（全关键帧编码版）
│   ├── images/background-keyframes/ # 栏目交界的尾帧/首帧关键帧
│   ├── og-image.png
│   └── favicon.svg
├── scripts/
│   ├── fetch-github.mjs        # 构建前拉取开源项目数快照（prebuild，失败保留旧值）
│   ├── fetch-travel.mjs        # dev/build 前同步旅行足迹快照（三级回退）
│   └── gen-admin-hash.mjs      # 生成/重置后台密码哈希
├── shots/                      # 验收探针与截图产物（见上表）
├── src/
│   ├── App.jsx                 # hash 路由 ＋ 共享 scroll lerp/速度信号 ＋ 边界承载 ＋ 内容层运镜 ＋ 色温切换
│   ├── main.jsx / index.css    # 设计系统 v3（暗夜放映室：色板/字体三层/曲线三族/动效全部住在这里与组件内联样式）
│   ├── admin/                  # 后台（懒加载 chunk）
│   ├── components/             # 27 个前台组件（VideoBackground 混合驱动背景 / TravelMap 足迹地图等）
│   ├── data/
│   │   ├── content/*.json      # 全部站点文案与视频映射（后台可编辑，11 份）
│   │   ├── github.json         # 开源项目数快照（脚本生成，勿手改）
│   │   └── generated/travel.json  # 旅行数据快照（脚本生成，勿手改）
│   └── lib/                    # toast / clipboard / HTML 白名单消毒
├── PROGRESS.md                 # 动效节拍表、边界承载账、各轮验收数字
├── BLOCKED.md                  # 待裁决清单
└── .github/workflows/deploy.yml
```

## 内容编辑

### 方式一：直接改 JSON

编辑 `src/data/content/*.json` 后提交，站点自动重建。关于区 `intro` 字段支持极有限的标签（`<em> <strong> <b> <i> <br>`），前台按结构化解析渲染，不注入原始 HTML。

### 方式二：后台（推荐日常使用）

访问 `https://…/cmchen-page/#/admin`，输入管理密码进入。

1. **GitHub 连接**：填入 Personal Access Token（fine-grained，仅勾选本仓库 Contents: Read and write）
2. **编辑**：左侧选分区，表单化修改
3. **保存**：「保存并提交」推送到分支，Pages 约 1–2 分钟后自动重建
4. **改密码**：安全页更新 或 本地 `node scripts/gen-admin-hash.mjs <新密码>`

### 改旅行足迹

在**博客站点**的关于页后台改城市标记并提交即可——主页在下次 dev/build 时经 `fetch-travel.mjs` 自动同步。

## 部署

推送到 `main` 分支后 GitHub Actions 自动构建并发布到 GitHub Pages。

- `vite.config.js` 中 `base: '/cmchen-page/'` 与 Pages 子路径对应
- 运行时抓取博客文章依赖博客站与主页同源；若博客绑定自定义域名需补 CORS
- 旅行数据同步以博客仓库 `main` 分支 `src/data/about-personal.ts` 为唯一上游

## 设计与无障碍

- 全站遵循 `prefers-reduced-motion`：背景静帧、入场即时、跑马灯停转、运镜与承载归零、光标隐藏、色温不切换、地图入场动画关闭
- 键盘焦点可见（`focus-visible` 描边），交互元素 `aria-label`，装饰元素 `aria-hidden`
- 背景亮度以「克制偏暗」为基准（视频全画面均值 ≈15% 亮度 ＋ 滚动压暗编舞 ＋ 静态暗角遮罩）
- 悬停联动类效果（Awards 行联动、Skills 剪切、Contact 磁吸、自定义光标）均以 `(hover: hover)` / `(pointer: fine)` 门控，触屏退化为静态等亮排版
- `?static=1&y=1234` 为截图/调试钩子：冻结全部动画直出终态并瞬时滚到指定位置
