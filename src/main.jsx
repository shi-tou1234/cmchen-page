import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 字体全部打包进站（不依赖 CDN / 系统安装情况）：
//   display  Cormorant Garamond（拉丁巨字/数字）+ Noto Serif SC 可变字重（中文宋体）
//   body     Noto Sans SC 可变字重——长段落可读性
//   mono     JetBrains Mono——编号、年份、meta 等小字号的打字机质感
// 可变字体一个字重轴覆盖 200-900，比按字重引多份静态子集更省；
// Cormorant 只取用到的字重与斜体（拉丁字形小，代价可忽略）。
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource-variable/noto-sans-sc'
import '@fontsource-variable/noto-serif-sc'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600-italic.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
