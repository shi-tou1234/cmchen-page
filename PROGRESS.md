# PROGRESS

## 开工回执（2026-08-22）
- 目标：五项升级——①仓库数自动拉取修复 ②邮箱复制提示 ③竞赛区去点击暗示 ④内容数据化+GitHub API 可编辑后台 ⑤首页动画升级（深空强化、零依赖）。
- 顺序：0核验→1→2→3→4→5，每任务完成即 commit。
- 最大风险：④⑤都大改组件，若冲突以④的数据结构为准回改⑤。

## 基线（任务0）
- lint：0 错；build：成功；fetch 脚本本地正常 repos=11。
- 线上数字不更新根因：prebuild/scripts/src/data 均未提交（线上从未跑过拉取）+ CI 裸调 API 有限流风险。

## 进度
- [x] 任务0 基线核验完成
- [x] 任务1 仓库数修复：脚本加固（白名单/GITHUB_TOKEN/保旧值）+ CI 注入 token + 运行时拉取缓存兜底（eab17c6）
- [x] 任务2 邮箱复制：Toast 组件 + Contact/Footer 点击复制（01f11d0）
- [x] 任务3 竞赛区去点击暗示：移除箭头列与相关样式（f5f3449）
- [x] 任务4 内容数据化 + 后台：9 个 content JSON、#/admin（PBKDF2 锁 + Contents API 读写 + sha 冲突重试）、初始密码已生成、AdminApp 独立 chunk
- [ ] 任务5 首页动画升级
- 备注：本机开发网络 TLS 拦截，本地跑 fetch 脚本需 GH_INSECURE_TLS=1；CI 不受影响
