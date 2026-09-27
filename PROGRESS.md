# PROGRESS

> 上一轮（09-26 暗夜放映室重构）的进度与经验已在 git 历史（3544f49…a7bd761）与提交信息里，本文件从本轮（09-27 onetake 动效叙事改造）重写。

## 开工回执（2026-09-27，onetake 动效叙事改造）

- 理解的目标：把「每区块各自淡入」的幻灯片式入场，改成区块互相生长——边界处有元素活过去并变形（承载）、滚动有呼吸段+爆发段（节奏）、snap/spring/settle 三族曲线混搭、内容层明显运镜（0.96→1 推进）但停留中线时真静止；粒子层收敛。基线 7967e38，全程不 push。
- 顺序：任务 1 曲线族打底 → 2 边界承载 → 3 滚动运镜 → 4 粒子/因果 → 5 交付。（曲线族先行：运镜与承载都要消费新曲线变量。）
- 最大风险：App.jsx 的 lerp loop 是全站滚动驱动的心脏，叠加运镜逻辑若写漏「静止区」或写了非合成器属性会全站卡顿——运镜全部挂在既有 currentY 帧循环里、只写 transform、带「变化才写」哨兵；其次边界截图的「中点」取法要在两区块之间的真实滚动位上取，否则截到的是入场终态。
- 三族曲线定值（拍板允许执行者定，值记录于此）：
  - --ease-snap（入场急停，onetake t80≈.23）：cubic-bezier(0.19, 1, 0.22, 1)，时长 0.55–0.7s
  - --ease-spring（回弹，SwiftUI snappy ζ≈0.85）：cubic-bezier(0.34, 1.56, 0.64, 1)，时长 0.6–0.8s
  - --ease-settle（大位移缓落，原 soft S 保留语义）：cubic-bezier(0.22, 1, 0.36, 1)，时长 0.9–1.2s
- 任务 0 结果：git log -1 = 7967e38 ✓；lint 0 警告 0 错误 ✓；build ✓ 497ms；preview(4177，复用上轮遗留实例) + node shots/capture.mjs → 8 张 PNG ✓。全部对上。

## 节拍表（任务 1 能量曲线，全页滚动旅程）

| 区块 | 段性 | 节奏设计 |
|---|---|---|
| hero | burst | 开场爆发：标题字母组 0.55s snap 逐个落（40ms 錯位），meta 行 spring 追上，按钮对最后落定 |
| hero→about 边界 | rest | 过场发丝线慢展开 1.2s settle，近静默 |
| about | cascade | 宣言逐字点亮（滚动驱动，非 timer），卡片 0.6s snap 错位 120ms——全页最长错位 |
| about→awards 边界 | rest | 年份藏书票水印从 -60px 缓沉 1.1s |
| awards | burst | 三条奖项 0.45s snap 短促连击（60ms 错位，全页最快） |
| skills | rest→cascade | 标题 snap 后网格整组 spring 一次到位（不逐个） |
| projects | burst | Z 字网格：左卡 snap 右卡 spring 交错，90ms 錯位；箭头微交互保留 |
| blog | cascade | 引语卡 0.7s settle 长错位 140ms，收在安静里 |
| contact/footer | rest | 全页收尾呼吸段：全部 settle 长时长，无 burst |

边界承载明细（任务 2 逐边界记录）见下方「边界承载账」。

## 进度

- [x] 任务 0：基线核对全过（见回执）。
- [x] 任务 1 曲线族与节奏打散：三族曲线落 index.css（families 29 处、--ease-out 裸用 0）＋组件 delay 重排（StatsStrip 70ms、Blog 140ms、Awards 60ms burst、Skills 整组 spring）；反向验证红(0)→绿(29) 已贴对话。
- [x] 任务 2 承载：ghost 边界交接（App.jsx lerp 层）＋金线生长链（sec-rule / contact line scaleX 接在全宽发丝线后）＋capture-boundary.mjs 7 张边界截图与数值证据；反向验证红(Δ0)→绿(Δ0.07) 已贴对话。
- [x] 任务 3 运镜：内容容器进场 0.96→1 + 26px 升沉、出场 1→1.03；阅读区恒等（真静止）；footer 不参与（片尾卡豁免，与 onetake end-card 规则一致）；reduced-motion 脏写入=[]、720 帧采样 p95=9.9ms、App.jsx 仅写 transform/opacity/willChange。
- [x] 任务 4 粒子收敛：32→19 颗（59.4%）、点亮度 0.22→0.15、连线 0.035→0.03、静止冻结（活跃度指数衰减）、快滚沿真实位移拉细痕。悬停/按压全页过一遍：view-all/btn/contact-btn/contact-ghost/project-card/project-go/post/award-row/skill-row/stat-cell/footer-link/marquee/split 字/fw 字均有反馈，无死悬停；按压态 btn/contact-btn 已有「压进阴影」。
- [x] 任务 5 交付：lint 0/0、build ✓、单 commit 到 main（见交付清单）。

## 边界承载账（任务 2：每边界谁活过去了、做什么）

| 边界 | 活过去的元素 | 数值证据（边界位→静止位） |
|---|---|---|
| top→about | ABOUT ghost 放大浮出＋容器推近＋金线链 | ghost 1.070→1、op 0.67→1；cam 0.979→1 |
| about→awards | AWARDS ghost＋年份藏书票 settle＋金线链 | ghost 1.070→1、op 0.67→1；cam 0.9789→1 |
| awards→skills | SKILLS ghost＋金线链＋技能行整组 spring | ghost 1.070→1、op 0.67→1；cam 0.9789→1 |
| skills→projects | WORKS ghost＋金线链＋view-all 金线 | ghost 1.070→1、op 0.67→1；cam 0.979→1 |
| projects→blog | BLOG ghost＋金线链＋引语卡 settle | ghost 1.070→1、op 0.67→1；cam 0.9789→1 |
| blog→contact | CONTACT ghost＋金线链＋contact 标题 settle | ghost 1.070→1、op 0.67→1；cam 0.9789→1 |
| contact→footer | CONTACT ghost 离场＋页脚巨字 settle 升起 | ghost 1.0041→1（弱）；cam 1.002→1 |

contact→footer 偏弱的说明：contact 是最后一个整段，maxScroll 前其退场窗口（topVis<-0.7vh）物理上推不满，Δ 只有 0.4%；按 onetake「bare cuts only into the end card」豁免片尾卡入场承载，此边界由 ghost 离场＋巨字升起＋滚动本身承担。这是设计判断，不是遗留缺陷；若领导要更明显，可把 footer 纳入相机（需给 footer 内容加一层非 Reveal 的变换宿主）。

另外记录一个结构性发现：Footer 没有 .container 直子（结构是 footer > Reveal），相机宿主不含 footer——与片尾卡豁免正好一致。

## 反馈轮（2026-09-27 领导实测反馈：滚动时背景抽搐）

- 机制定位：静止 650ms 后背景以 1 倍速自动播放，播放头前进；滚轮唤醒「滚动刮擦」时，纯函数映射把播放头瞬间拽回映射位置——间歇滚轮形成「播放→拽回」循环。探针实测修复前 3 次回跳、最大 2.39s（shots/probe-scrub.mjs，三手势×900ms 间隙）。
- 修复：① 唤醒帧把播放头差记成一次性 drift（clamp ±3.5s 只防异常），随滚动每帧 ×0.96 衰减归零——播放头平滑滑回映射，不回跳；drift 每轮实测、不进映射基线，不复现旧 MAP_OFFSET 的累积漂移（VideoBackground.jsx timeAt/update/syncIdleState）。② seek 在途（video.seeking）不再重启解码＋阈值 0.015→0.03s，砍一半 seek 次数，帧按序显示。③ App.jsx 相机容器的 will-change 改动态升降级（临近视口且非恒等才占 GPU 层，归位即还），削掉 8 个常驻大平面层的解码竞争。
- 修复路上两笔返工，如实记：第一版捕获条件误带 `!force`（timeAt 的 force 形参就是 seekRequested，唤醒帧恰为 true，捕获被跳过）；clamp ±1.2s 裁掉了首段长静止攒的 drift 残留一次 1.22s 回跳。两处修正后回跳清零。
- 复验：修复后同探针 0 次回跳（before 3 次/max 2.39s → after 0 次/max 0），lint 0/0、build ✓。

## 反馈轮 2（2026-09-27 领导第二项：开场编排每次刷新都播）

- 原状：Preloader 有 sessionStorage 记忆（cmchen-page:preloaded），同一会话刷新跳过开场。
- 改动：删掉跳过记忆——每次整页刷新都完整播放「逐字打出 cmchen → 幕布揭幕 → 巨字弹入」；保留 ?static=1 截图跳过、reduced-motion 秒进；hasShownThisLoad 仅防 React 重挂载重复开演，整页刷新归零（Preloader.jsx）。
- 复验：shots/probe-intro.mjs 同一会话连续两次加载，两次 preloader 均在 DOM、加载后揭幕、sessionStorage 标记为 null ✓。
- 本地端口清理：4177/5173/5174/5175 旧实例全部杀掉，重起单一 preview（4177，生产构建）。

## 交付清单（任务 5）

- 区块终态截图（改造后）：shots/01-hero.png … shots/08-footer.png（8 张，node shots/capture.mjs 复跑可再现）
- 边界承载截图：shots/b-top-about.png … shots/b-contact-footer.png（7 张）
- 取证脚本：shots/capture-boundary.mjs（7 边界截图＋ghost/相机数值证据，node shots/capture-boundary.mjs）；shots/probe-motion.mjs（reduced-motion 脏写入检查＋10s 滚动帧率采样）
- 判卷工具未动：shots/capture.mjs、package.json、vite 配置——git diff 可证
- 单 commit：见 git log（本轮全部改动一次提交）
