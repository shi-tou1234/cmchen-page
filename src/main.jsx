import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 字体全部打包进站（不依赖 CDN / 系统安装情况）：
//   display  Playfair Display（拉丁大标题）+ Noto Serif SC（中文宋体骨架）——编辑体主线
//   body     Noto Sans SC——长段落可读性
//   mono     JetBrains Mono——编号、年份、meta 等小字号的打字机质感
// 三层各司其职：衬线撑气质、黑体撑可读、等宽撑信息层级。
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/500.css'
import '@fontsource/noto-serif-sc/600.css'
// 拉丁 display 只取需要的字重：正文级 400、标题级 500/600、斜体水印 500。
// CJK 字体每个字重会拆成上百个 unicode-range 子集，多引一个字重就是上百个
// @font-face，这里按实际用到的重量精确挑选。
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-500-italic.css'
import '@fontsource/playfair-display/latin-600.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
