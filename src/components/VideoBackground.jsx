import { useEffect, useRef } from 'react'
import backgrounds from '../data/content/backgrounds.json'

// 背景放映（v3）：
// · 滚动即播放头——每组连续同片区块的滚动区间线性映射片长，静止即停住；
// · 唯一例外：首页（sectionOrder 首屏）命中的片子，静止时以原生倍速自动
//   播放，滚动立刻暂停回刮擦态（领导指定：首页流星片自动播放，其余纯滚动）；
// · 换场：跨组那一刻把透明度交给 CSS 交叉溶解（0.95s），与滚动速度彻底
//   解耦——快滚慢滚溶解节奏恒定，这是「丝滑」的来源。旧版的滚动映射
//   透明度权重、暗场 veil 闪烁、转场动态 blur 是发闷/发卡的三个来源，全拆；
// · 清晰度：视频层不挂任何常驻 filter；Ken Burns 压到 1.02 防放大糊化
//   （画质本体由素材重编码解决：轻降噪 + 自适应锐化 + 密集关键帧）。
const BASE_URL = import.meta.env.BASE_URL
const START_TIME = 0.02
const END_EPSILON = 0.08
const PLAYBACK_EPSILON = 0.12
const IDLE_SETTLE_MS = 650

const AUTOPLAY_CLIP = backgrounds.sections[backgrounds.sectionOrder[0]]

const clipMap = new Map(backgrounds.clips.map((clip) => [clip.id, clip]))

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smoothstep = (value) => value * value * (3 - 2 * value)
const asset = (path) => `${BASE_URL}${path}`

// 每组 = 一段连续映射同一视频的区块；组的滚动区间映射到片长首尾
const buildTrackRanges = (sectionClipIds, boundaries, maxScroll) => {
  const groups = []

  sectionClipIds.forEach((clipId, sectionIndex) => {
    const previous = groups[groups.length - 1]
    if (!previous || previous.clipId !== clipId) {
      groups.push({ clipId, startIndex: sectionIndex, endIndex: sectionIndex })
    } else {
      previous.endIndex = sectionIndex
    }
  })

  const ranges = groups.map((group, groupIndex) => {
    const startY =
      groupIndex === 0 ? 0 : boundaries[group.startIndex]
    const endY =
      groupIndex === groups.length - 1
        ? Math.max(maxScroll, startY + 1)
        : boundaries[group.endIndex + 1]

    return {
      ...group,
      startY,
      endY: Math.max(startY + 1, endY),
    }
  })

  const rangeBySection = []
  ranges.forEach((range) => {
    for (let index = range.startIndex; index <= range.endIndex; index += 1) {
      rangeBySection[index] = range
    }
  })

  return { ranges, rangeBySection }
}

export default function VideoBackground() {
  const reelRef = useRef(null)
  const videoRefs = useRef({})

  useEffect(() => {
    const reel = reelRef.current
    const sectionEls = backgrounds.sectionOrder
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!reel || !sectionEls.length) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sectionIds = sectionEls.map((el) => el.id)
    const sectionClipIds = sectionIds.map((id) => backgrounds.sections[id])

    const metrics = []
    const boundaries = []
    let rangeBySection = []
    let maxScroll = 0
    const assigned = Object.fromEntries(
      backgrounds.clips.map((clip) => [clip.id, -1]),
    )
    const autoLoadStarted = new Set()
    const styleState = new Map(
      backgrounds.clips.map((clip) => [
        clip.id,
        {
          opacity: videoRefs.current[clip.id]?.style.opacity ?? '',
          visible: videoRefs.current[clip.id]?.dataset.visible ?? '',
        },
      ]),
    )
    const motion = { lastY: null, velocity: 0 }
    let lastMappedY = null
    let lastActiveId = null
    let lastActivity = performance.now()
    let raf = 0

    const measure = () => {
      metrics.splice(
        0,
        metrics.length,
        ...sectionEls.map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            top: rect.top + window.scrollY,
          }
        }),
      )
      boundaries.splice(
        0,
        boundaries.length,
        ...metrics.map((metric) => metric.top - window.innerHeight * 0.5),
      )
      maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      const built = buildTrackRanges(sectionClipIds, boundaries, maxScroll)
      rangeBySection = built.rangeBySection
    }

    const clipDuration = (id) => {
      const video = videoRefs.current[id]
      const fallback = clipMap.get(id)?.duration
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        return video.duration
      }
      return fallback || 10
    }

    const setVideoTime = (id, value, force = false) => {
      const video = videoRefs.current[id]
      if (!video || video.readyState < 1) return
      const duration = clipDuration(id)
      if (!Number.isFinite(duration) || duration <= 0) return
      const end = Math.max(START_TIME, duration - END_EPSILON)
      const next = clamp(value, START_TIME, end)
      const reference = force ? video.currentTime : (assigned[id] ?? -1)
      const threshold = force ? 0.03 : 0.015
      if (Math.abs(reference - next) < threshold) {
        assigned[id] = next
        return
      }
      try {
        video.currentTime = next
        assigned[id] = next
      } catch {
        // 媒体尚未完全可 seek 时，下一帧会继续尝试。
      }
    }

    const requestAutoLoad = (id) => {
      if (autoLoadStarted.has(id)) return
      const video = videoRefs.current[id]
      if (!video) return
      autoLoadStarted.add(id)
      video.preload = 'auto'
      video.load()
    }

    // 换场：只改透明度/可见性两个状态位，渐变本身交给 CSS transition——
    // 无论滚轮多快，溶解都以恒定节奏走完
    const applyGroup = (clipId) => {
      for (const clip of backgrounds.clips) {
        const video = videoRefs.current[clip.id]
        if (!video) continue
        const active = clip.id === clipId
        const state = styleState.get(clip.id)
        const opacity = active ? '1' : '0'
        const visible = active ? '1' : '0'
        if (state && state.opacity !== opacity) {
          video.style.opacity = opacity
          state.opacity = opacity
        }
        if (state && state.visible !== visible) {
          video.dataset.visible = visible
          state.visible = visible
        }
        if (active) requestAutoLoad(clip.id)
      }
    }

    // 播放闸门：只有「首页那段」且静止时允许自动播放；其余一律暂停，
    // 画面完全由滚动位置驱动
    const syncPlayback = (activeId, moving) => {
      for (const clip of backgrounds.clips) {
        const video = videoRefs.current[clip.id]
        if (!video) continue
        const shouldPlay =
          !reduced &&
          !document.hidden &&
          !moving &&
          clip.id === activeId &&
          activeId === AUTOPLAY_CLIP
        if (shouldPlay) {
          if (video.readyState >= 2 && video.paused) {
            video.play().catch(() => {})
          }
        } else if (!video.paused) {
          video.pause()
        }
      }
    }

    const timeAt = (id, range, y, force = false) => {
      if (!range) return
      const distance = Math.max(1, range.endY - range.startY)
      const progress = smoothstep(clamp((y - range.startY) / distance, 0, 1))
      const end = Math.max(START_TIME, clipDuration(id) - END_EPSILON)
      setVideoTime(id, START_TIME + progress * (end - START_TIME), force)
    }

    const update = () => {
      if (!metrics.length) return
      const smoothY = window.__smoothY
      // 后台标签可能冻结 lerp 值；此时直接跟随原生滚动，避免视频停在错误栏目。
      const y =
        Number.isFinite(smoothY) &&
        document.visibilityState === 'visible' &&
        Math.abs(smoothY - window.scrollY) < window.innerHeight * 1.5
          ? smoothY
          : window.scrollY

      let activeIndex = 0
      for (let i = 1; i < boundaries.length; i += 1) {
        if (y >= boundaries[i]) activeIndex = i
      }
      const activeId = sectionClipIds[activeIndex]

      const seekRequested = lastMappedY === null || Math.abs(y - lastMappedY) > 0.05
      lastMappedY = y

      if (motion.lastY !== null) {
        motion.velocity += (y - motion.lastY - motion.velocity) * 0.12
      }
      motion.lastY = y

      const moving =
        seekRequested || Math.abs(motion.velocity) > PLAYBACK_EPSILON
      if (moving) {
        lastActivity = performance.now()
      }

      if (lastActiveId !== activeId) {
        applyGroup(activeId)
        lastActiveId = activeId
      }

      // 自动播放片例外：自由播放，不被滚动改写播放头
      if (activeId !== AUTOPLAY_CLIP) {
        timeAt(activeId, rangeBySection[activeIndex], y, seekRequested)
      }
      syncPlayback(activeId, moving)
    }

    const frame = () => {
      raf = 0
      if (document.hidden) return
      update()
      if (performance.now() - lastActivity < IDLE_SETTLE_MS) {
        raf = requestAnimationFrame(frame)
      } else {
        // 静止窗口到期：补跑一帧收尾（首页片在此刻接管为自动播放），
        // 之后 rAF 完全停下——播放由浏览器视频管线驱动，不需要我们参与
        update()
      }
    }

    const wake = () => {
      lastActivity = performance.now()
      if (document.hidden) {
        update()
        return
      }
      if (raf) return
      raf = requestAnimationFrame(frame)
    }

    const onMetadata = () => {
      update()
      wake()
    }
    const videos = backgrounds.clips
      .map((clip) => videoRefs.current[clip.id])
      .filter(Boolean)
    videos.forEach((video) => video.addEventListener('loadedmetadata', onMetadata))

    const refreshLayout = () => {
      motion.lastY = null
      motion.velocity = 0
      lastMappedY = null
      measure()
      update()
      wake()
    }
    const onResize = () => refreshLayout()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      refreshLayout()
    }
    const layoutObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(refreshLayout)
        : null
    layoutObserver?.observe(document.body)
    const unlock = () => {
      wake()
    }

    measure()
    document.fonts?.ready
      .then(() => {
        measure()
        update()
        wake()
      })
      .catch(() => {})
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pointerdown', unlock, { once: true })

    const onScrollWake = () => wake()
    window.addEventListener('scroll', onScrollWake, { passive: true })
    update()
    wake()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollWake)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pointerdown', unlock)
      layoutObserver?.disconnect()
      videos.forEach((video) => video.removeEventListener('loadedmetadata', onMetadata))
    }
  }, [])

  return (
    <>
      <div ref={reelRef} className="bg-canvas bg-reel" aria-hidden="true">
        <div className="bg-stage">
          {backgrounds.clips.map((clip, index) => (
            <video
              key={clip.id}
              ref={(el) => {
                videoRefs.current[clip.id] = el
              }}
              className="bg-video-layer"
              data-clip={clip.id}
              poster={asset(clip.poster)}
              src={asset(clip.src)}
              muted
              loop
              playsInline
              preload={index === 0 ? 'auto' : 'metadata'}
              disablePictureInPicture
              style={{ opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>
        <div className="bg-reel-vignette" aria-hidden="true" />
        <div className="bg-veil" aria-hidden="true" />
      </div>
      <div className="bg-shade" aria-hidden="true" />
    </>
  )
}
