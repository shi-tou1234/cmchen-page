# cmchen-page

个人作品集网站 — 暗色主题，WebGL 星云背景，React + Vite 构建。

**在线访问**: [cmchen-page](https://shi-tou1234.github.io/cmchen-page/)

## 技术栈

- React 19 + Vite 8
- WebGL 片段着色器（星云 + 星空 + 流星）
- 纯 CSS 动画（Scroll Reveal / 字符上升 / 打字机 / 数字滚动）
- oxlint 代码检查
- GitHub Actions 自动部署到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 构建与部署

```bash
npm run build    # 输出到 dist/
npm run preview  # 本地预览构建结果
```

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

## 页面结构

| 区块 | 说明 |
|------|------|
| Hero | WebGL 星云 + 星空 + 流星（仅首屏） |
| Marquee | 技术栈滚动条 |
| Stats | GitHub 开源项目数自动拉取 + 数字滚动 |
| 关于 | 专业/学历信息，双栏布局 |
| 竞赛 | 获奖记录 |
| 项目 | 作品卡片，3D 倾斜交互 |
| 博客 | 实时拉取最新文章 |
| 联系 | 邮箱 + GitHub |

## License

MIT