import { useEffect, useRef } from 'react'
import backgrounds from '../data/content/backgrounds.json'

// 每个视频只对应一个连续轨道：栏目滚动进度直接映射到 0 → 结尾，
// 不再使用 ping-pong 循环。跨栏目时两个轨道在重叠窗口内自然交叉溶解。
const BASE_URL = import.meta.env.BASE_URL
const START_TIME = 0.02
const END_EPSILON = 0.08
const TRANSITION_SPAN_RATIO = 0.46
const TRANSITION_MIN = 220
const TRANSITION_MAX = 520
const PLAYBACK_EPSILON = 0.12
const IDLE_SETTLE_MS = 650
// 静止时让当前可见的视频真正播放起来（而不是冻帧）。
// 倍速必须是 1：素材是 24fps，0.3 倍速等于每 139ms 才换一帧——那是 7Hz 的
// 幻灯片，正是「背景卡顿」的真正来源。1 倍速就是素材本来的 24fps，播放器
// 直接按原生节奏送帧，反而最稳。循环靠 loop 属性，首尾硬切对氛围片无感。
const IDLE_PLAYBACK_RATE = 1

const clipMap = new Map(backgrounds.clips.map((clip) => [clip.id, clip]))

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const smoothstep = (value) => value * value * (3 - 2 * value)
const asset = (path) => `${BASE_URL}${path}`

const transitionSpan = (viewportHeight) =>
  clamp(
    viewportHeight * TRANSITION_SPAN_RATIO,
    TRANSITION_MIN,
    TRANSITION_MAX,
  )

const buildTrackRanges = (sectionClipIds, boundaries, viewportHeight, maxScroll) => {
  const groups = []

  sectionClipIds.forEach((clipId, sectionIndex) => {
    const previous = groups[groups.length - 1]
    if (!previous || previous.clipId !== clipId) {
      groups.push({ clipId, startIndex: sectionIndex, endIndex: sectionIndex })
    } else {
      previous.endIndex = sectionIndex
    }
  })

  const span = transitionSpan(viewportHeight)
  const ranges = groups.map((group, groupIndex) => {
    const startY =
      groupIndex === 0 ? 0 : boundaries[group.startIndex] - span / 2
    const endY =
      groupIndex === groups.length - 1
        ? Math.max(maxScroll, startY + 1)
        : boundaries[group.endIndex + 1] + span / 2

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
  const outRefs = useRef({})
  const inRefs = useRef({})
  const veilRef = useRef(null)

  useEffect(() => {
    const reel = reelRef.current
    const sectionEls = backgrounds.sectionOrder
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!reel || !sectionEls.length) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sectionIds = sectionEls.map((el) => el.id)
    const sectionClipIds = sectionIds.map((id) => backgrounds.sections[id])
    const transitionMap = new Map()
    for (let i = 1; i < sectionIds.length; i += 1) {
      const from = sectionClipIds[i - 1]
      const to = sectionClipIds[i]
      const transition = backgrounds.transitions.find(
        (item) => item.from === from && item.to === to,
      )
      if (transition) transitionMap.set(i, transition)
    }

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
        { opacity: '', visibility: '', filter: '', visible: '' },
      ]),
    )
    const motion = { lastY: null, velocity: 0 }
    let lastMappedY = null
    let lastActivity = performance.now()
    let raf = 0
    // idle 播放与滚动刮擦的「播放头差」：静止时视频以 1 倍速前进，滚轮一 wakes
    // 刮擦映射会把播放头瞬间拽回映射位置——最多回跳一秒素材，间歇滚轮时
    // 播放→拽回→播放循环，就是背景抽搐的来源。修法：唤醒瞬间把差值记成
    // drift，随滚动指数衰减归零（平滑追赶，不回跳；每次唤醒重新实测，
    // 不叠加进映射基线，不会复现旧 MAP_OFFSET 的累积漂移）
    const driftMap = new Map(backgrounds.clips.map((clip) => [clip.id, 0]))
    let idlePlaying = false
    // update() 算出的当帧滚动状态，供 timeAt() 在唤醒帧做 drift 捕捉
    let wakeInfo = { requested: false, motion: 0 }

    const measure = () => {
      const viewportHeight = Math.max(1, window.innerHeight)
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
        ...metrics.map((metric) => metric.top - viewportHeight * 0.5),
      )
      maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      const built = buildTrackRanges(
        sectionClipIds,
        boundaries,
        viewportHeight,
        maxScroll,
      )
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
      // 0.03s ≈ 24fps 素材的 0.7 帧，肉眼不可分；把 seek 频率砍半，刮擦更稳
      const threshold = force ? 0.03 : 0.03
      if (Math.abs(reference - next) < threshold) {
        assigned[id] = next
        return
      }
      // seek 还在解码途中就不重启：一次只让解码器追一个目标，
      // 密集改 currentTime 会反复取消解码——帧 burst 显示就是「抽」
      if (video.seeking && !force) return
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

    // 静止时不再冻帧：让当前可见的视频以原生倍速继续播放，画面始终在动。
    // 流畅性靠三件事保证——
    //   ① 只播权重最高的那一条，其余保持暂停（最多 1 条在解码）；
    //   ② 1 倍速即素材原生 24fps，不做慢放（慢放会把 24fps 压成 7Hz 幻灯片）；
    //   ③ 视频层上没有任何 filter / transform，全部交给合成器直接贴图。
    // 滚轮一动就 pause() 回到纯 seek 驱动，rAF 随即停摆。
    // forceIdle：rAF 静止窗口到期时补跑的那一帧。此刻滚动速度早已归零，
    // 但 seekRequested / velocity 还留着上一帧的残值，必须显式覆盖。
    const syncIdleState = (weights, scrollMotion, seekRequested, forceIdle) => {
      const moving = !forceIdle && (seekRequested || scrollMotion > PLAYBACK_EPSILON)

      if (reduced || moving) {
        // 滚动接管（或减少动效）：全部暂停，回到纯 seek 驱动
        idlePlaying = false
        for (const clip of backgrounds.clips) {
          const video = videoRefs.current[clip.id]
          if (video && !video.paused) video.pause()
        }
        return
      }

      // 只有权重最高的那一条参与解码播放
      let leadId = null
      let leadWeight = 0
      for (const clip of backgrounds.clips) {
        const weight = weights.get(clip.id) || 0
        if (weight > leadWeight) {
          leadWeight = weight
          leadId = clip.id
        }
      }
      // 交叉溶解的中段：两条各占一半，此时谁都算不上「主角」，
      // 与其猜一个不如都冻住，等溶解结束再交给新的主角
      const lead = leadWeight > 0.55 ? leadId : null

      for (const clip of backgrounds.clips) {
        const video = videoRefs.current[clip.id]
        if (!video) continue
        const weight = weights.get(clip.id) || 0
        const visible = weight > 0.01 ? '1' : '0'
        const state = styleState.get(clip.id)
        if (state && state.visible !== visible) {
          video.dataset.visible = visible
          state.visible = visible
        }
        if (clip.id === lead) {
          // play() 是「登记意图」：数据未就绪也先挂上，浏览器一到
          // 可播状态就自动开演——线上首屏加载慢时，rAF 静止窗口
          // （650ms）内视频往往还没下到首帧，若等 readyState 再调
          // play()，循环停摆后就永远没人再播（线上背景不动的事故）
          if (video.playbackRate !== IDLE_PLAYBACK_RATE) {
            video.playbackRate = IDLE_PLAYBACK_RATE
          }
          if (video.paused) video.play().catch(() => {})
          idlePlaying = true
        } else if (!video.paused) {
          // 不是主角却还在播（例如刚跨过栏目，主角刚换人）：停掉
          video.pause()
        }
      }
    }

    const getTimeline = (y, viewportHeight) => {
      let active = 0
      let transitionIndex = -1
      let progress = 0
      const span = transitionSpan(viewportHeight)

      for (let i = 1; i < boundaries.length; i += 1) {
        if (y >= boundaries[i]) active = i
        const start = boundaries[i] - span / 2
        const end = boundaries[i] + span / 2
        if (y >= start && y < end) {
          transitionIndex = i
          progress = smoothstep((y - start) / span)
          break
        }
      }

      return { active, transitionIndex, progress }
    }

    // 滚动映射：把 y 换算成播放头时间。
    //
    // 这里不做「idle 漂移补偿」的旧方案（MAP_OFFSET 把补偿并进映射基线，
    // 多轮 idle↔滚动后误差叠加越滚越偏——已弃）。现在的做法见 timeAt()：
    // 唤醒帧把播放头差记成一次性的 drift，随滚动指数衰减归零。
    // 每轮的 drift 都是唤醒瞬间实测值，不进基线、不跨轮累积；
    // 映射本身保持「滚动位置 → 时间」这条干净纯函数，任何时候可复现。
    const timeAt = (id, range, y, force = false) => {
      if (!range) return
      const distance = Math.max(1, range.endY - range.startY)
      const progress = smoothstep(clamp((y - range.startY) / distance, 0, 1))
      const end = Math.max(START_TIME, clipDuration(id) - END_EPSILON)
      const pure = START_TIME + progress * (end - START_TIME)
      // 唤醒帧：idle 播放把播放头推前了，把差值记成 drift（clamp ±1.2s 防异常），
      // 之后每帧衰减——播放头从当前位置平滑滑回映射，不再 snap 回跳。
      // 注意 timeAt 的 force 形参就是 seekRequested：唤醒帧它为 true，
      // 捕获必须发生在这一帧，不能用 !force 拦（否则回跳照旧）
      if (idlePlaying && (wakeInfo.requested || wakeInfo.motion > 0.02)) {
        const video = videoRefs.current[id]
        if (video && Number.isFinite(video.currentTime)) {
          // clamp 只防 currentTime 异常，不裁行为：首次长静止攒的 drift
          // 可以到 2-3s，裁小了就会残留一次回跳
          const d = clamp(video.currentTime - pure, -3.5, 3.5)
          driftMap.set(id, Math.abs(d) > 0.04 ? d : 0)
        }
        idlePlaying = false
      }
      setVideoTime(id, pure + (driftMap.get(id) || 0), force)
    }

    const update = (forceIdle = false) => {
      if (!metrics.length) return
      const smoothY = window.__smoothY
      // 后台标签可能冻结 lerp 值；此时直接跟随原生滚动，避免视频停在错误栏目。
      const y =
        Number.isFinite(smoothY) &&
        document.visibilityState === 'visible' &&
        Math.abs(smoothY - window.scrollY) < window.innerHeight * 1.5
          ? smoothY
          : window.scrollY
      const viewportHeight = Math.max(1, window.innerHeight)
      const timeline = getTimeline(y, viewportHeight)
      const activeTransition =
        timeline.transitionIndex >= 0
          ? transitionMap.get(timeline.transitionIndex)
          : null
      const seekRequested =
        lastMappedY === null || Math.abs(y - lastMappedY) > 0.05
      lastMappedY = y

      if (motion.lastY !== null) {
        motion.velocity += (y - motion.lastY - motion.velocity) * 0.12
      }
      motion.lastY = y

      const scrollMotion = Math.abs(motion.velocity)
      // 供 timeAt 的唤醒帧捕捉用；同时让 drift 每帧向 0 衰减（约 1s 归零）
      wakeInfo = { requested: seekRequested, motion: scrollMotion }
      driftMap.forEach((value, id) => {
        if (value !== 0) driftMap.set(id, Math.abs(value) < 0.02 ? 0 : value * 0.96)
      })
      if (seekRequested || scrollMotion > 0.02) {
        lastActivity = performance.now()
      }
      const transitionBlur = activeTransition && scrollMotion > 0.08
        ? Math.sin(Math.PI * timeline.progress) * 0.18
        : 0
      const weights = new Map()

      if (activeTransition) {
        const fromId = activeTransition.from
        const toId = activeTransition.to
        weights.set(fromId, Math.max(weights.get(fromId) || 0, 1 - timeline.progress))
        weights.set(toId, Math.max(weights.get(toId) || 0, timeline.progress))
      } else {
        weights.set(sectionClipIds[timeline.active], 1)
      }

      for (const clip of backgrounds.clips) {
        const video = videoRefs.current[clip.id]
        const weight = weights.get(clip.id) || 0
        if (!video) continue
        const state = styleState.get(clip.id)
        const opacity = weight.toFixed(3)
        const visibility = weight > 0.01 ? 'visible' : 'hidden'
        const filter = transitionBlur > 0.01 ? `blur(${transitionBlur.toFixed(2)}px)` : ''
        if (state) {
          if (state.opacity !== opacity) {
            video.style.opacity = opacity
            state.opacity = opacity
          }
          if (state.visibility !== visibility) {
            video.style.visibility = visibility
            state.visibility = visibility
          }
          if (state.filter !== filter) {
            video.style.filter = filter
            state.filter = filter
          }
        } else {
          video.style.opacity = opacity
          video.style.visibility = visibility
          video.style.filter = filter
        }
        if (weight > 0.01) requestAutoLoad(clip.id)
      }

      for (const transition of backgrounds.transitions) {
        const out = outRefs.current[transition.id]
        const incoming = inRefs.current[transition.id]
        const isCurrent = activeTransition?.id === transition.id
        // 正常模式让真实视频完成过渡；减少动效模式才用首尾静帧。
        const keyframeMix = reduced && isCurrent ? 1 : 0
        const nextOut = keyframeMix ? (1 - timeline.progress).toFixed(3) : '0'
        const nextIn = keyframeMix ? timeline.progress.toFixed(3) : '0'
        if (out && out.dataset.opacity !== nextOut) {
          out.dataset.opacity = nextOut
          out.style.opacity = nextOut
        }
        if (incoming && incoming.dataset.opacity !== nextIn) {
          incoming.dataset.opacity = nextIn
          incoming.style.opacity = nextIn
        }
      }

      if (veilRef.current) {
        const veilOpacity = activeTransition ? Math.sin(Math.PI * timeline.progress) * 0.06 : 0
        const nextVeil = veilOpacity.toFixed(3)
        if (veilRef.current.dataset.opacity !== nextVeil) {
          veilRef.current.dataset.opacity = nextVeil
          veilRef.current.style.opacity = nextVeil
        }
      }

      if (activeTransition) {
        const fromRange = rangeBySection[timeline.transitionIndex - 1]
        const toRange = rangeBySection[timeline.transitionIndex]
        if (reduced) {
          setVideoTime(
            activeTransition.from,
            Math.max(START_TIME, clipDuration(activeTransition.from) - END_EPSILON),
            seekRequested,
          )
          setVideoTime(activeTransition.to, START_TIME, seekRequested)
        } else {
          timeAt(activeTransition.from, fromRange, y, seekRequested)
          timeAt(activeTransition.to, toRange, y, seekRequested)
        }
        syncIdleState(weights, scrollMotion, seekRequested, forceIdle)
        return
      }

      const activeId = sectionClipIds[timeline.active]
      const activeRange = rangeBySection[timeline.active]
      if (reduced) {
        setVideoTime(activeId, clipDuration(activeId) * 0.18, seekRequested)
      } else {
        timeAt(activeId, activeRange, y, seekRequested)
      }
      syncIdleState(weights, scrollMotion, seekRequested, forceIdle)
    }

    const frame = () => {
      raf = 0
      if (document.hidden) return
      update()
      if (performance.now() - lastActivity < IDLE_SETTLE_MS) {
        raf = requestAnimationFrame(frame)
      } else {
        // 静止窗口到期：补跑一帧并强制走「无人滚动」分支，
        // 把当前主角交给慢速播放。之后 rAF 完全停下——
        // 播放本身由浏览器的视频管线驱动，不需要我们每帧参与。
        update(true)
      }
    }

    const wake = () => {
      lastActivity = performance.now()
      if (reduced) return
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
    // canplay（首帧可用）也唤醒一次判定：慢网络下 loadedmetadata 时
    // 还没有首帧，等数据到位要再给播放闸门一次机会
    videos.forEach((video) => {
      video.addEventListener('loadedmetadata', onMetadata)
      video.addEventListener('canplay', onMetadata)
    })

    const refreshLayout = () => {
      motion.lastY = null
      motion.velocity = 0
      lastMappedY = null
      // 布局重算会整体平移映射，旧 drift 作废
      driftMap.forEach((value, id) => driftMap.set(id, 0))
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

    if (reduced) {
      const onScroll = () => update()
      window.addEventListener('scroll', onScroll, { passive: true })
      update()
      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVisible)
        window.removeEventListener('pointerdown', unlock)
        layoutObserver?.disconnect()
        videos.forEach((video) => {
          video.removeEventListener('loadedmetadata', onMetadata)
          video.removeEventListener('canplay', onMetadata)
        })
      }
    }

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
      videos.forEach((video) => {
        video.removeEventListener('loadedmetadata', onMetadata)
        video.removeEventListener('canplay', onMetadata)
      })
    }
  }, [])

  return (
    <>
      <div ref={reelRef} className="bg-canvas bg-reel" aria-hidden="true">
        {/* 视频层单独包一层：固定的降噪 / 锐化滤镜挂在这一层，
            视频元素自己的 inline filter（转场瞬间的动态模糊）就不会覆盖掉它 */}
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
        {backgrounds.transitions.map((transition) => (
          <div className="bg-transition" key={transition.id} data-transition={transition.id}>
            <img
              ref={(el) => {
                outRefs.current[transition.id] = el
              }}
              className="bg-transition-frame"
              src={asset(transition.out)}
              alt=""
              decoding="async"
            />
            <img
              ref={(el) => {
                inRefs.current[transition.id] = el
              }}
              className="bg-transition-frame"
              src={asset(transition.in)}
              alt=""
              decoding="async"
            />
          </div>
        ))}
        <div ref={veilRef} className="bg-transition-veil" aria-hidden="true" />
        <div className="bg-reel-vignette" aria-hidden="true" />
        <div className="bg-veil" aria-hidden="true" />
      </div>
      <div className="bg-shade" aria-hidden="true" />
    </>
  )
}
