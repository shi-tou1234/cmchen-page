import { useEffect, useRef } from 'react'

// 混合驱动视频背景（视频保持暂停，播放头由 rAF 手动推）：
// ① 环境自播——播放头以 0.45x 匀速往返（ping-pong，首尾帧不同所以不用 loop 硬切），雾永远在流动；
// ② 滚动推拉——滚轮速度按比例叠加到播放头（下滚推进旅程、上滚倒回），页面静止时背景也是活的；
// ③ 压暗/下沉/放大/微旋转仍由 App.jsx 对 .bg-canvas 的滚动编排驱动，本组件只管「时间」。
// 素材为全关键帧编码（public/videos/bg-blue-hour.mp4），高频 seek 不跨关键帧。
export default function VideoBackground() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Safari/iOS 必须真实播放过一次才允许后续 seek 出画面；静音播放后立刻暂停即解锁
    let unlocked = false
    const unlock = () => {
      if (unlocked) return
      unlocked = true
      video.play().then(() => video.pause()).catch(() => {})
    }

    const AMBIENT_RATE = 0.45 // 静止时雾的流动速度（相对原速）
    const SEC_PER_PX = 0.0012 // 滚动 1px 推进的播放头秒数（约 6~7 屏滚完整段旅程）
    const BOOST_LIMIT = 0.15 // 单帧滚动贡献上限（秒），甩滚不跳帧

    let raf = 0
    let assigned = -1
    let current = 0
    let dir = 1
    let lastY = null
    let smoothVel = 0
    let lastTs = 0

    const frame = (ts) => {
      raf = requestAnimationFrame(frame)
      // 元数据未就绪/页面隐藏时不积分——NaN 时长会让下方的钳制全部失效
      if (document.hidden || !Number.isFinite(video.duration) || video.duration <= 0) {
        lastTs = ts
        return
      }
      const dt = Math.min(((ts - lastTs) / 1000) || 0, 0.1)
      lastTs = ts

      // 滚动速度：读 App.jsx 已平滑的 __smoothY，帧间差再平滑一层后折算成播放头位移
      const y = Number.isFinite(window.__smoothY) ? window.__smoothY : window.scrollY
      if (lastY === null) lastY = y
      smoothVel += (y - lastY - smoothVel) * 0.12
      lastY = y
      const boost = Math.max(-BOOST_LIMIT, Math.min(BOOST_LIMIT, smoothVel * SEC_PER_PX))

      current += dt * AMBIENT_RATE * dir + boost
      const end = video.duration - 0.1
      // 无条件钳制 + NaN 自愈：任何异常值都拉回行程内，方向按触碰的边界翻转
      if (!Number.isFinite(current) || current >= end) {
        current = end
        dir = -1
      } else if (current <= 0.02) {
        current = 0.02
        dir = 1
      }

      // 阈值 ≈ 半帧（24fps 素材帧距 42ms），低于它不值得触发一次解码
      if (Math.abs(current - assigned) < 0.02) return
      assigned = current
      video.currentTime = current
    }

    const onVisible = () => {
      // 回前台时 __smoothY 已被 App.jsx 对齐到真实滚动位置，速度历史作废重采
      if (document.visibilityState === 'visible') {
        lastY = null
        smoothVel = 0
      }
    }

    if (reduced) {
      // 与原着色器同策略：减动效偏好下降为单帧静态（取前 1/5 处的全景帧）
      const still = () => {
        video.currentTime = Math.min(video.duration * 0.18, video.duration - 0.1)
      }
      if (video.readyState >= 1) still()
      else video.addEventListener('loadedmetadata', still, { once: true })
    } else {
      window.addEventListener('pointerdown', unlock, { once: true })
      document.addEventListener('visibilitychange', onVisible)
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', unlock)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <>
      <video
        ref={videoRef}
        className="bg-canvas bg-video"
        src={`${import.meta.env.BASE_URL}videos/bg-blue-hour.mp4`}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
      />
      {/* 暗角遮罩必须是视频的静态兄弟层（v9 教训：遮罩进运镜层会随变换露盒边） */}
      <div className="bg-shade" aria-hidden="true" />
    </>
  )
}
