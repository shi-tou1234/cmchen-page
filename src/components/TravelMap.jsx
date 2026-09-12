import { useEffect, useRef } from 'react'
import travel from '../data/generated/travel.json'

// 旅行足迹地图（自博客站点 TravelMap.astro 移植为 React 版，仅查看模式）：
// 全国视图点亮去过的省份，点击省份下钻到城市视图；数据来自 scripts/fetch-travel.mjs
// 在 dev/build 时从博客仓库拉取的快照，与博客「关于」页保持同源。
// 地图边界为静态资源（public/maps，拷贝自博客站点），懒加载：进入视口才动态 import echarts。
const BASE = import.meta.env.BASE_URL || '/'

const FALLBACK_ADCODE = {
  北京市: '110000',
  天津市: '120000',
  河北省: '130000',
  山西省: '140000',
  内蒙古自治区: '150000',
  辽宁省: '210000',
  吉林省: '220000',
  黑龙江省: '230000',
  上海市: '310000',
  江苏省: '320000',
  浙江省: '330000',
  安徽省: '340000',
  福建省: '350000',
  江西省: '360000',
  山东省: '370000',
  河南省: '410000',
  湖北省: '420000',
  湖南省: '430000',
  广东省: '440000',
  广西壮族自治区: '450000',
  海南省: '460000',
  重庆市: '500000',
  四川省: '510000',
  贵州省: '520000',
  云南省: '530000',
  西藏自治区: '540000',
  陕西省: '610000',
  甘肃省: '620000',
  青海省: '630000',
  宁夏回族自治区: '640000',
  新疆维吾尔自治区: '650000',
  台湾省: '710000',
  香港特别行政区: '810000',
  澳门特别行政区: '820000',
}

function normalizeRegionName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/特别行政区$/u, '')
    .replace(/壮族自治区$/u, '')
    .replace(/回族自治区$/u, '')
    .replace(/维吾尔自治区$/u, '')
    .replace(/自治区$/u, '')
    .replace(/省$/u, '')
    .replace(/市$/u, '')
}

function normalizeCityName(name) {
  return String(name || '').trim().replace(/\s+/g, '')
}

function makeCityKey(province, city) {
  return `${normalizeRegionName(province)}::${normalizeCityName(city || province)}`
}

const geoCache = new Map()

async function fetchGeo(url, cacheKey) {
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const geo = await res.json()
  geoCache.set(cacheKey, geo)
  return geo
}

const fetchChina = () =>
  fetchGeo(`${BASE}maps/china.full.json`, 'china')

const fetchProvince = (adcode) =>
  fetchGeo(`${BASE}maps/provinces/${encodeURIComponent(adcode)}.json`, String(adcode))

async function ensureEcharts() {
  if (!window.__tmEcharts) {
    const [core, charts, comps, renderers] = await Promise.all([
      import('echarts/core'),
      import('echarts/charts'),
      import('echarts/components'),
      import('echarts/renderers'),
    ])
    core.use([charts.MapChart, comps.TooltipComponent, renderers.CanvasRenderer])
    window.__tmEcharts = core
  }
  return window.__tmEcharts
}

export default function TravelMap() {
  const wrapRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const stage = stageRef.current
    if (!wrap || !stage) return undefined

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let chart = null

    // 访问索引：省份名归一化集合 + 省内城市集合
    const state = {
      level: 'country',
      provinceName: '',
      provinceAdcode: '',
      adcodeByName: new Map(),
      adcodeByNorm: new Map(),
      provinceSet: new Set(),
      citiesByProvince: new Map(),
    }
    const visited = new Map()
    travel.cities
      .filter((c) => c.visited !== false)
      .forEach((c) => {
        const pKey = normalizeRegionName(c.province)
        if (!pKey || !c.city) return
        visited.set(makeCityKey(c.province, c.city), { province: c.province, city: c.city })
        state.provinceSet.add(pKey)
        if (!state.citiesByProvince.has(pKey)) state.citiesByProvince.set(pKey, new Set())
        state.citiesByProvince.get(pKey).add(normalizeCityName(c.city))
      })

    const q = (role) => wrap.querySelector(`[data-role="${role}"]`)
    const elCityCount = q('city-count')
    const elProvCount = q('province-count')
    const elBack = q('back')
    const elCrumb = q('crumb')
    const elCrumbWrap = q('crumb-country')
    const elSearch = q('search')
    const elTags = q('tags')
    const elError = q('error')

    const css = (name, fallback) =>
      getComputedStyle(wrap).getPropertyValue(name).trim() || fallback
    const theme = {
      strong: css('--tm-strong', '#c9b998'),
      accent: css('--tm-accent', '#a98d5f'),
      text: css('--tm-text', '#eae2d5'),
      subtle: css('--tm-subtle', 'rgba(234, 226, 213, 0.56)'),
      mapArea: css('--tm-map-area', 'rgba(234, 226, 213, 0.045)'),
      mapBorder: css('--tm-map-border', 'rgba(234, 226, 213, 0.14)'),
      emphasis: css('--tm-emphasis', '#c9b998'),
      tipBg: css('--tm-tip-bg', '#0e0d0b'),
      tipBorder: css('--tm-tip-border', 'rgba(234, 226, 213, 0.22)'),
    }

    const visitedGradient = () => ({
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: theme.strong },
        { offset: 1, color: theme.accent },
      ],
    })

    function visitedCountIn(provinceName) {
      return state.citiesByProvince.get(normalizeRegionName(provinceName))?.size || 0
    }

    function getAdcode(name) {
      const norm = normalizeRegionName(name)
      return (
        state.adcodeByName.get(name) ||
        state.adcodeByNorm.get(norm) ||
        FALLBACK_ADCODE[name] ||
        Object.entries(FALLBACK_ADCODE).find(([k]) => normalizeRegionName(k) === norm)?.[1] ||
        null
      )
    }

    function setStats() {
      if (elCityCount) elCityCount.textContent = String(visited.size)
      if (elProvCount) elProvCount.textContent = String(state.provinceSet.size)
    }

    function renderTags() {
      if (!elTags) return
      const query = elSearch instanceof HTMLInputElement ? elSearch.value.trim().toLowerCase() : ''
      const items = [...visited.values()].filter((item) => {
        const label = `${item.province} · ${item.city}`
        return !query || label.toLowerCase().includes(query)
      })
      elTags.innerHTML = items.length
        ? items
            .map((it) => `<span class="tm-tag">${it.province} · ${it.city}</span>`)
            .join('')
        : '<span class="tm-empty">暂无记录</span>'
    }
    if (elSearch instanceof HTMLInputElement) elSearch.addEventListener('input', renderTags)

    function setError(on) {
      if (elError) elError.hidden = !on
    }

    function baseOption(mapName, data, tipFormatter) {
      return {
        backgroundColor: 'transparent',
        animation: !reduced,
        tooltip: {
          trigger: 'item',
          backgroundColor: theme.tipBg,
          borderColor: theme.tipBorder,
          textStyle: { color: theme.text },
          formatter: tipFormatter,
        },
        series: [
          {
            type: 'map',
            map: mapName,
            roam: true,
            label: { show: true, color: theme.subtle, fontSize: 10 },
            emphasis: {
              label: { color: theme.text, fontWeight: 'bold' },
              itemStyle: { areaColor: theme.emphasis },
            },
            itemStyle: {
              areaColor: theme.mapArea,
              borderColor: theme.mapBorder,
              borderWidth: 1,
            },
            data,
          },
        ],
      }
    }

    async function renderChina(ech) {
      state.level = 'country'
      state.provinceName = ''
      state.provinceAdcode = ''
      if (elBack) elBack.classList.remove('show')
      if (elCrumb) elCrumb.textContent = '全国视图'
      if (elCrumbWrap) elCrumbWrap.classList.add('disabled')
      setError(false)

      const geo = await fetchChina()
      ech.registerMap('tm-china', geo)

      state.adcodeByName.clear()
      state.adcodeByNorm.clear()
      const provinceNames = []
      ;(geo.features || []).forEach((f) => {
        const name = String(f?.properties?.name || '').trim()
        const adcode = String(f?.properties?.adcode || '').slice(0, 6)
        if (name && adcode) state.adcodeByName.set(name, adcode)
        if (name) {
          state.adcodeByNorm.set(normalizeRegionName(name), adcode)
          provinceNames.push(name)
        }
      })

      const data = provinceNames.map((name) => ({
        name,
        value: state.provinceSet.has(normalizeRegionName(name)) ? 1 : 0,
        itemStyle: state.provinceSet.has(normalizeRegionName(name))
          ? { areaColor: visitedGradient() }
          : undefined,
      }))

      const opt = baseOption('tm-china', data, (params) => {
        const count = visitedCountIn(params.name)
        return `<div style="font-weight:600;color:${theme.text}">${params.name}</div><div style="color:${theme.subtle}">已标记城市：${count}</div><div style="margin-top:4px;color:${theme.strong};font-size:12px">点击查看城市分布</div>`
      })
      opt.series[0].zoom = 1.16
      chart.setOption(opt, true)
    }

    async function renderProvince(name, adcode) {
      const code = String(adcode || '').trim()
      if (!code) return
      state.level = 'province'
      state.provinceName = name
      state.provinceAdcode = code
      if (elBack) elBack.classList.add('show')
      if (elCrumb) elCrumb.textContent = `${name} · 城市视图`
      if (elCrumbWrap) elCrumbWrap.classList.remove('disabled')

      const mapId = `tm-p-${code}`
      const geo = await fetchProvince(code)
      ech.registerMap(mapId, geo)

      const pKey = normalizeRegionName(name)
      const citySet = state.citiesByProvince.get(pKey) || new Set()
      const data = (geo.features || []).map((f) => {
        const cityName = String(f?.properties?.name || '').trim()
        const hit = citySet.has(normalizeCityName(cityName))
        return {
          name: cityName,
          value: hit ? 1 : 0,
          itemStyle: hit ? { areaColor: visitedGradient() } : undefined,
        }
      })

      const opt = baseOption(mapId, data, (params) => {
        const hit = Number(params.value) > 0
        return `<div style="font-weight:600;color:${theme.text}">${params.name}</div><div style="color:${theme.subtle}">${hit ? '已去过' : '未标记'}</div>`
      })
      opt.series[0].zoom = 0.92
      chart.setOption(opt, true)
    }

    function onMapClick(params) {
      if (!params?.name || disposed) return
      if (state.level === 'country') {
        const adcode = getAdcode(params.name)
        if (adcode) renderProvince(params.name, adcode).catch(() => setError(true))
      }
    }

    let echartsLib = null

    function backToChina() {
      if (chart) renderChina(echartsLib).catch(() => setError(true))
    }
    if (elBack instanceof HTMLButtonElement) elBack.addEventListener('click', backToChina)
    if (elCrumbWrap instanceof HTMLElement)
      elCrumbWrap.addEventListener('click', () => {
        if (state.level !== 'country') backToChina()
      })

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || disposed) return
        io.disconnect()
        ensureEcharts()
          .then((ech) => {
            if (disposed) return
            echartsLib = ech
            chart = ech.getInstanceByDom(stage) || ech.init(stage)
            chart.on('click', onMapClick)
            setStats()
            renderTags()
            renderChina(ech).catch(() => setError(true))
          })
          .catch(() => setError(true))
      },
      { rootMargin: '260px' },
    )
    io.observe(wrap)

    const onResize = () => chart && chart.resize()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      io.disconnect()
      window.removeEventListener('resize', onResize)
      if (elSearch instanceof HTMLInputElement)
        elSearch.removeEventListener('input', renderTags)
      if (chart) chart.dispose()
    }
  }, [])

  return (
    <div className="travel-map" ref={wrapRef}>
      <div className="tm-stats">
        <div className="tm-stat">
          <b data-role="city-count">—</b>
          <span>已访问城市</span>
        </div>
        <div className="tm-stat">
          <b data-role="province-count">—</b>
          <span>涉及省份</span>
        </div>
      </div>
      <div className="tm-map">
        <div className="tm-toolbar">
          <button type="button" className="tm-back" data-role="back">
            返回全国
          </button>
          <span className="tm-crumb">
            <i data-role="crumb-country">中国</i> / <em data-role="crumb">全国视图</em>
          </span>
        </div>
        <div className="tm-stage" ref={stageRef} />
        <div className="tm-error" data-role="error" hidden>
          地图加载失败，请刷新重试
        </div>
      </div>
      <div className="tm-side">
        <input
          className="tm-search"
          data-role="search"
          type="text"
          placeholder="搜索城市或省份…"
        />
        <div className="tm-tags" data-role="tags" />
      </div>
      <p className="tm-legend">
        <i className="tm-dot on" />已去过
        <i className="tm-dot" />未标记
        <span className="tm-note">点击省份可下钻 · 与博客关于页同源</span>
      </p>
    </div>
  )
}
