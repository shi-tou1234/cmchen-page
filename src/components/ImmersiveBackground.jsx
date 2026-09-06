import { useEffect, useRef } from 'react'
import bgNebula from '../assets/bg-nebula.jpg'

// 沉浸式背景 —— 一镜到底的「图像世界」，不是一块会滑动的画框
// 整张星云图放大到 160%（四周各 30% 画面藏在视口外），镜头沿一条连续
// 旅程滑行：从全景匀速滑向亮核不断推近，blog 到最远点，contact 回旋收束。
// 露边证明：横向平移用 vw、纵向用 vh，与余量（各轴 30%）同源——最远锚点
// （tx -27vw, s 1.32）单侧仍剩 55%-27% ≈ 28% 视口宽的余量，任何窗口比例、
// 任何锚点、叠加呼吸与视差都推不进视口，"画框"在几何上不可能出现；
// 视觉上再由加重的暗角把边缘吞进黑里。
// 图像自身以 48s 单向呼吸（scale-only）替代原视频的 8s 循环——循环跳切
// 也是「画框感」的来源，且 muted 自动播放并不可靠；呼吸只放大不缩小平移，
// 只会增加余量。教训沉淀：平移单位必须与余量同轴同源（v5 用 vh 平移横向
// 在窄窗口露边）；锚点必须同路径连续（v4 折返=乱）；无旋转、明暗不见底回摆。
// 滚动源读 App.jsx lerp 层的 window.__smoothY；收敛即停帧省 GPU。
const ANCHORS = [
  // key / 平移(%vw, %vh；tx- 朝亮核 ty- 朝画面下方) / 缩放 / 明暗(1=全亮)
  { key: 'top', tx: 0, ty: 0, scale: 1.12, op: 1 },
  { key: 'about', tx: -6, ty: -2, scale: 1.24, op: 0.94 },
  { key: 'awards', tx: -13, ty: -6, scale: 1.4, op: 0.88 },
  { key: 'skills', tx: -19, ty: -11, scale: 1.52, op: 0.84 },
  { key: 'projects', tx: -24, ty: -15, scale: 1.44, op: 0.87 },
  { key: 'blog', tx: -27, ty: -18, scale: 1.32, op: 0.9 },
  { key: 'contact', tx: -20, ty: -12, scale: 1.48, op: 0.88 },
]

const SECTION_IDS = ['top', 'about', 'awards', 'skills', 'projects', 'blog', 'contact']
// 过渡窗：区块顶位于视口 85% 高度时开始，滑到 5% 高度时完成（约 0.8 屏路程）
const WIN_START = 0.85
const WIN_END = 0.05

export default function ImmersiveBackground() {
  const parallaxRef = useRef(null)
  const canvasRef = useRef(null)

  // 分镜滚动编排：读平滑滚动源，在锚点间插值；收敛即停帧省 GPU
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    // 采集各区块的真实滚动位置（load / 尺寸变化时重测：字体、图片会推挤布局）
    let tops = []
    const measure = () => {
      tops = SECTION_IDS.map((id) =>
        Math.max(0, (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY)
      )
    }
    measure()
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('load', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)

    let raf = 0
    let written = ''
    let lastY = -1
    let idle = 0

    // 计算 + 写入（written 哨兵去重）。y 优先读 lerp 源 __smoothY；
    // 若它与真实 scrollY 脱钩（rAF 被冻结的环境，如内嵌预览面板），
    // 退回真实 scrollY——背景在任何环境都必须跟着滚动走。
    const render = () => {
      const raw = window.scrollY
      const smooth = window.__smoothY
      const y =
        typeof smooth === 'number' && Math.abs(smooth - raw) < window.innerHeight * 2
          ? smooth
          : raw
      const vh = window.innerHeight
      // clientWidth/Height = 排除滚动条后的布局视口，与 fixed 画布的实际
      // 可绘空间一致；innerWidth 含滚动条会让平移多算一条
      const vw = document.documentElement.clientWidth

      // 过渡窗：从锚点 0 出发，逐个区块按进入窗口进度混合——
      // 顺序累计，经过窗口时切换到该区块锚点，其余时间精确停留
      let tx = ANCHORS[0].tx
      let ty = ANCHORS[0].ty
      let scale = ANCHORS[0].scale
      let op = ANCHORS[0].op
      for (let i = 1; i < tops.length; i++) {
        const t = (y - (tops[i] - vh * WIN_START)) / (vh * (WIN_START - WIN_END))
        // smoothstep：两端轻起轻落，长窗口上读起来是匀速滑行而非脉冲
        const p = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
        if (p > 0) {
          const a = ANCHORS[i]
          tx += (a.tx - tx) * p
          ty += (a.ty - ty) * p
          scale += (a.scale - scale) * p
          op += (a.op - op) * p
        }
      }

      const next = `${tx.toFixed(1)}|${ty.toFixed(1)}|${scale.toFixed(4)}|${op.toFixed(3)}`
      if (next !== written) {
        written = next
        canvas.style.opacity = op.toFixed(3)
        // 横向按 vw、纵向按 vh：与媒体层余量（各轴 30%）同源，任何窗口比例不露边
        canvas.style.transform = `translate3d(${(tx * vw / 100).toFixed(1)}px, ${(ty * vh / 100).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
      }
      return y
    }

    const loop = () => {
      raf = 0
      const y = render()
      // lerp 源静止即停帧：定格期逐帧合成全屏图层是纯浪费，滚动事件再唤醒
      if (Math.abs(y - lastY) < 0.08) idle += 1
      else idle = 0
      lastY = y
      if (idle < 8) raf = requestAnimationFrame(loop)
    }

    const wake = () => {
      idle = 0
      if (!raf) raf = requestAnimationFrame(loop)
    }
    // 回前台时 App 会把 lerp 源对齐真实滚动位置，这里同步唤醒对齐一次
    const onVis = () => {
      if (document.visibilityState === 'visible') wake()
    }

    window.addEventListener('scroll', wake, { passive: true })
    document.addEventListener('visibilitychange', onVis)
    wake()

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
      window.removeEventListener('scroll', wake)
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // 鼠标视差：transform 由 lerp 循环写入，收敛到足够接近就停帧省性能
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const el = parallaxRef.current
    if (!el) return

    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0

    const loop = () => {
      raf = 0
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        el.style.transform = `translate3d(${(-cx * 12).toFixed(2)}px, ${(-cy * 8).toFixed(2)}px, 0)`
        raf = requestAnimationFrame(loop)
      }
    }
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* 运镜层：只装图像世界。遮罩绝不能放进这里——它会跟着平移缩放，
          其盒边会随镜头扫过视口（v8「最新文章边框变窄/最后几页过渡奇怪」
          的根源），暗角必须钉死在视口上。 */}
      <div className="bg-canvas bg-photo" aria-hidden="true" ref={canvasRef}>
        <div className="bg-photo-parallax" ref={parallaxRef}>
          <img className="bg-photo-img" src={bgNebula} alt="" draggable="false" />
        </div>
      </div>
      {/* 视口级静态遮罩：压暗渐变 + 四周暗角，永远正对视口 */}
      <div className="bg-photo-shade" aria-hidden="true" />
    </>
  )
}
