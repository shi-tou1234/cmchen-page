# PROGRESS

## 开工回执（2026-09-26）

- 理解的目标：以 8bfda64（领导本地版）为基线，不动文字内容与视频文件，重建字体/版式/卡片/动效/视频编排，交付 8 张截图，全程不 push。
- 顺序：任务0 基线 → 1 字体 → 2 版式卡片 → 3 动效流畅 → 4 视频编排 → 5 交付截图。
- 最大风险：index.css 5202 行是多轮叠加产物，重写样式若漏掉组件在用的类名会局部破版——先全量盘点组件 className 再动笔；其次 CJK display 字体在 @fontsource 的可选项有限，任务 1 可能要保守保留 Noto Serif SC 只换字重策略。

## 内容 JSON 指纹（任务 0 存档，交付时复核）

```
5535bd09ee20c6124dd38e13b35c11c8f3d3ec72b003bff1186a80ed6f04dad9  about.json
5e5661879a4dcd1dcbf9044a71dd5638eaf458206adfe990d1c2024acea796b2  awards.json
41b36828403402ae6918c56b608e7fcedbd4cb3ff6a3887960409fb588212d75  blog.json
bb5fc1e82a994069757570c83f7000ad064332d41fe0d6edf96c7a9f297a5f94  contact.json
6ad81bb66c91c973f19b3e515a29d6ebabf42acd527e7d7c7a6471726aeb1d26  hero.json
6a90e09f46666516b63f53a2fe9f616c6e26b1ad4b0b74a30c34150cbf6ac7c7  marquee.json
2e8cc7534dc6471fedf768339a335d24fbfbce4f3661c41f408227da0efa8990  projects.json
93de640724194cef690474652274e474ce1a91809d5cb7eb12e1136414cec663  site.json
472d472414da68f86daa624ce7286ed945813cd47dabcded3be1dcd8b25f4f5c  skills.json
9881058f7e42f578292010b2aaab279784e23e2a1ede165e73c02979bcfbf2b5  stats.json
```

## 进度

- [x] 任务 0：lint 0/0、build ✓1.22s、dist 82M、commit 3544f49——全部对上；基线 commit 8bfda64。
- [x] 任务 1 字体：Cormorant Garamond + 思源宋/黑可变字重 + JetBrains Mono；555e23e
- [x] 任务 2 版式卡片：index.css 5202→2826 行设计系统重写；7 区块截图已验；555e23e
- [x] 任务 3 动效流畅：全屏 hue/blur 滤镜拆除、推轨走 __smoothY 缓存度量、backdrop-filter 全站仅后台 admin 2 处（不在视频层上）；6c8f7b7
- [x] 任务 4 视频编排：about→snow、blog→night-stream，转场全落既有溶解对；CSS Ken Burns 运镜；9c778fd
- [x] 任务 5 交付：shots/01-08 八张截图（有头 Edge＋画布桥取真实视频帧）＋BLOCKED.md（无）＋PROGRESS.md；a7bd761

## 经验备注

- Edge（headless/headful）的 CDP 截图管线合成不出 <video> 层：验收截图用「画布桥」——把可见视频当前帧 drawImage 进 canvas 注入为背景层再截，帧即真实播放画面。
- 异步内容（博客文章/旅行地图）会让页面高度中途生长，分段截图前先做一次「滚到底再回顶」的预热滚动。
- ?static=1&y=1234 截图调试钩子留在 Preloader：冻结动画直出终态＋瞬时滚到指定位置。
