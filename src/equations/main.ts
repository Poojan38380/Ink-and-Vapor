// Ink & Vapor — Equations page
// Scroll reveals, progress bar, interactive demos, sticky footer

import { clamp, lerp } from '../shared/utils'

// --- Globals ---
const progressEl = document.getElementById('progress') as HTMLDivElement | null
const footerEl = document.getElementById('sticky-footer') as HTMLDivElement | null
const sections = document.querySelectorAll<HTMLElement>('[data-section]')
let lastInteraction = 0
let demos: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number; draw: (t: number) => void }[] = []

function showFooter(): void { lastInteraction = performance.now() / 1000 }

// --- Scroll progress ---
function updateProgress(): void {
  if (!progressEl) return
  const st = window.scrollY
  const dh = document.documentElement.scrollHeight - window.innerHeight
  progressEl.style.width = `${dh > 0 ? clamp(st / dh, 0, 1) * 100 : 0}%`
}

// --- Section reveal ---
function updateSections(): void {
  const tp = window.innerHeight * 0.82
  for (const s of sections) {
    if (s.getBoundingClientRect().top < tp) s.classList.add('visible')
  }
}

// --- Sticky footer ---
function updateFooter(): void {
  if (!footerEl) return
  footerEl.classList.toggle('visible', (performance.now() / 1000 - lastInteraction) < 5)
}

// --- Demo factory ---
function mk(id: string): { c: HTMLCanvasElement; x: CanvasRenderingContext2D; w: number; h: number } {
  const el = document.getElementById(id)
  if (!el) throw new Error(id)
  const c = document.createElement('canvas')
  c.style.cssText = 'display:block;width:100%;height:100%'
  el.appendChild(c)
  const dpr = window.devicePixelRatio || 1
  const r = el.getBoundingClientRect()
  c.width = r.width * dpr
  c.height = r.height * dpr
  const x = c.getContext('2d')!
  x.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { c, x, w: r.width, h: r.height }
}

function reg(c: HTMLCanvasElement, draw: (t: number) => void): void {
  const ctx = c.getContext('2d')
  if (!ctx) return
  const r = c.getBoundingClientRect()
  demos.push({ canvas: c, ctx, w: r.width, h: r.height, draw })
}

// ===== DEMO 1: Boundary Wave with sliders =====
function initBoundaryWave(): void {
  const { c, x, w, h } = mk('demo-boundary')
  const p = { a1: 12, a2: 6, a3: 3, w1: 0.6, w2: 1.2, w3: 2.1 }

  const sc = document.createElement('div')
  sc.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px 12px;margin-top:10px;'
  const sliders = [
    { k: 'a1' as const, l: 'A₁', min: 0, max: 30, s: 0.5 },
    { k: 'a2' as const, l: 'A₂', min: 0, max: 20, s: 0.5 },
    { k: 'a3' as const, l: 'A₃', min: 0, max: 15, s: 0.5 },
    { k: 'w1' as const, l: 'ω₁', min: 0, max: 3, s: 0.05 },
    { k: 'w2' as const, l: 'ω₂', min: 0, max: 3, s: 0.05 },
    { k: 'w3' as const, l: 'ω₃', min: 0, max: 5, s: 0.05 },
  ]
  sliders.forEach(sl => {
    const lb = document.createElement('label')
    lb.style.cssText = 'font:10px "IBM Plex Mono",monospace;color:#8a7e68;display:flex;flex-direction:column;gap:2px;'
    lb.innerHTML = `${sl.l}=<span>${p[sl.k]}</span>`
    const inp = document.createElement('input')
    inp.type = 'range'; inp.min = String(sl.min); inp.max = String(sl.max)
    inp.step = String(sl.s); inp.value = String(p[sl.k])
    inp.style.cssText = 'width:100%;accent-color:#c4a35a;height:3px;cursor:pointer;'
    inp.oninput = () => { p[sl.k] = +inp.value; lb.querySelector('span')!.textContent = (+inp.value).toFixed(2) }
    lb.appendChild(inp); sc.appendChild(lb)
  })
  document.getElementById('demo-boundary')!.parentElement!.insertBefore(sc, c.nextSibling)

  const comps = [
    () => ({ a: p.a1, k: 0.008, w: p.w1, ph: 0, col: '#6e8efb66' }),
    () => ({ a: p.a2, k: 0.018, w: p.w2, ph: Math.PI / 2, col: '#a777e366' }),
    () => ({ a: p.a3, k: 0.035, w: p.w3, ph: Math.PI / 4, col: '#4ecdc466' }),
  ]

  function draw(t: number): void {
    x.clearRect(0, 0, w, h); const my = h / 2, pts = 300, dx = w / (pts - 1)
    for (const fn of comps) {
      const co = fn()
      x.globalAlpha = 0.5; x.strokeStyle = co.col; x.lineWidth = 1.2
      x.setLineDash([3, 3]); x.beginPath()
      for (let i = 0; i <= pts; i++) {
        const px = i * dx, py = my + co.a * Math.sin(co.k * px + co.w * t + co.ph)
        i === 0 ? x.moveTo(px, py) : x.lineTo(px, py)
      }
      x.stroke(); x.setLineDash([])
    }
    x.globalAlpha = 1; x.strokeStyle = '#d4c8a0'; x.lineWidth = 2
    x.shadowColor = '#c4a35a44'; x.shadowBlur = 10; x.beginPath()
    for (let i = 0; i <= pts; i++) {
      const px = i * dx; let py = my
      for (const fn of comps) { const co = fn(); py += co.a * Math.sin(co.k * px + co.w * t + co.ph) }
      i === 0 ? x.moveTo(px, py) : x.lineTo(px, py)
    }
    x.stroke(); x.shadowBlur = 0
  }
  reg(c, draw)
}

// ===== DEMO 2: Click Ripples =====
function initRippleDemo(): void {
  const { c, x, w, h } = mk('demo-ripples')
  const ripples: { x: number; t: number }[] = []
  c.onclick = (e: MouseEvent) => {
    const r = c.getBoundingClientRect()
    ripples.push({ x: e.clientX - r.left, t: performance.now() / 1000 })
  }

  function draw(t: number): void {
    x.clearRect(0, 0, w, h); const my = h / 2, pts = 300, dx = w / (pts - 1)
    // Base wave
    x.globalAlpha = 0.15; x.strokeStyle = '#8a7e68'; x.lineWidth = 1
    x.setLineDash([3, 3]); x.beginPath()
    for (let i = 0; i <= pts; i++) {
      const px = i * dx, py = my + 8 * Math.sin(0.01 * px + 0.5 * t)
      i === 0 ? x.moveTo(px, py) : x.lineTo(px, py)
    }
    x.stroke(); x.setLineDash([])

    // Prune
    for (let i = ripples.length - 1; i >= 0; i--) {
      if (Math.exp(-1.8 * (t - ripples[i].t)) < 0.01) ripples.splice(i, 1)
    }

    // Composite
    x.globalAlpha = 0.7; x.strokeStyle = '#6e8efb'; x.lineWidth = 1.5; x.beginPath()
    for (let i = 0; i <= pts; i++) {
      const px = i * dx; let py = my + 8 * Math.sin(0.01 * px + 0.5 * t)
      for (const r of ripples) {
        const age = t - r.t, dist = Math.abs(px - r.x), front = 400 * age
        const env = Math.exp(-((dist - front) ** 2) / 12800)
        py += 30 * env * Math.exp(-1.8 * age) * Math.sin((dist - front) * 0.05)
      }
      i === 0 ? x.moveTo(px, py) : x.lineTo(px, py)
    }
    x.stroke()

    // Circles
    for (const r of ripples) {
      const age = t - r.t, a = Math.exp(-1.8 * age)
      if (a < 0.05) continue
      x.globalAlpha = a * 0.3; x.beginPath()
      x.arc(r.x, my, 400 * age, 0, Math.PI * 2); x.stroke()
    }

    if (t < 3) {
      x.globalAlpha = (1 - t / 3) * 0.4; x.fillStyle = '#8a7e68'
      x.font = '10px "Instrument Sans",sans-serif'; x.textAlign = 'center'
      x.fillText('click to spawn ripples', w / 2, h - 10)
    }
    x.globalAlpha = 1
  }
  reg(c, draw)
}

// ===== DEMO 3: Circular Wave =====
function initCircularWaveDemo(): void {
  const { c, x, w, h } = mk('demo-circular')
  let mx = w / 2, my = h / 2, lc = -10
  c.onmousemove = (e: MouseEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top }
  c.onclick = () => { lc = performance.now() / 1000 }

  function draw(t: number): void {
    x.clearRect(0, 0, w, h); const br = 30, seg = 80
    const cb = t - lc < 0.6 ? Math.exp(-(t - lc) * 6) * 8 : 0
    x.globalAlpha = 0.05; x.fillStyle = '#6e8efb'
    x.beginPath(); x.arc(mx, my, br + 15, 0, Math.PI * 2); x.fill()

    x.globalAlpha = 0.8; x.strokeStyle = '#6e8efb'; x.lineWidth = 2; x.lineJoin = 'round'
    x.beginPath()
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2
      const d = 3 * Math.sin(a * 7 + t * 2) + 1.5 * Math.cos(a * 10.5 - t * 1.4) + cb * Math.sin(a * 4 + t * 6)
      const r = br + d, px = mx + Math.cos(a) * r, py = my + Math.sin(a) * r
      i === 0 ? x.moveTo(px, py) : x.lineTo(px, py)
    }
    x.closePath(); x.stroke()

    if (cb > 0.1) {
      x.globalAlpha = cb * 0.3; x.strokeStyle = '#a777e3'; x.lineWidth = 1.5
      x.beginPath(); x.arc(mx, my, br + cb * 4, 0, Math.PI * 2); x.stroke()
    }
    x.globalAlpha = 0.8; x.fillStyle = '#6e8efb'
    x.beginPath(); x.arc(mx, my, 2.5 + cb * 1.5, 0, Math.PI * 2); x.fill()

    if (t < 3) {
      x.globalAlpha = (1 - t / 3) * 0.4; x.fillStyle = '#8a7e68'
      x.font = '10px "Instrument Sans",sans-serif'; x.textAlign = 'center'
      x.fillText('move mouse · click for pulse', w / 2, h - 10)
    }
    x.globalAlpha = 1
  }
  reg(c, draw)
}

// ===== DEMO 4: Vortex =====
function initVortexDemo(): void {
  const { c, x, w, h } = mk('demo-vortex')
  c.style.cursor = 'crosshair'

  interface P { x: number; y: number; vx: number; vy: number; s: number; age: number }
  const ps: P[] = Array.from({ length: 300 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
    s: 1 + Math.random() * 2.5, age: Math.random() * 10,
  }))

  let md = false, mx = w / 2, my = h / 2, lt = 0

  // Use addEventListener to avoid overwriting global handlers
  const onDown = (e: MouseEvent) => { md = true; const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top }
  const onMove = (e: MouseEvent) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top }
  const onUp = () => { md = false }
  c.addEventListener('mousedown', onDown)
  c.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)

  function draw(ts: number): void {
    const t = ts / 1000
    const dt = Math.min(ts > lt ? (ts - lt) / 1000 : 0.016, 0.05)
    lt = ts

    // First frame: clear. Subsequent: trail overlay
    if (dt < 0.002) { x.clearRect(0, 0, w, h) }
    else {
      x.globalAlpha = 0.15
      x.fillStyle = '#0a0a0f'
      x.fillRect(0, 0, w, h)
    }

    // Update particles
    for (const p of ps) {
      p.age += dt
      if (md) {
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 3 && d < 150) {
          const f = (1 - d / 150) / d
          // Radial pull + tangential spin
          p.vx += (-dx * 800 + dy * 1200) * f * dt
          p.vy += (-dy * 800 - dx * 1200) * f * dt
        }
      }
      // Ambient drift
      p.vx += Math.sin(p.age * 0.5 + p.y * 0.02) * 5 * dt
      p.vy += Math.cos(p.age * 0.4 + p.x * 0.02) * 5 * dt

      p.x += p.vx * dt; p.y += p.vy * dt
      p.vx *= 0.98; p.vy *= 0.98

      // Wrap
      if (p.x < -5) p.x += w + 10; if (p.x > w + 5) p.x -= w + 10
      if (p.y < -5) p.y += h + 10; if (p.y > h + 5) p.y -= h + 10
    }

    // Draw particles
    for (const p of ps) {
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      const alpha = md ? Math.min(1, 0.4 + sp * 0.005) : Math.min(0.7, 0.2 + sp * 0.003)
      x.globalAlpha = alpha

      // Color: purple when fast (vortex), blue when slow
      if (sp > 150) {
        x.fillStyle = '#a777e3'
      } else if (sp > 60) {
        const t2 = (sp - 60) / 90
        x.fillStyle = `rgb(${Math.round(110 + t2 * 57)},${Math.round(142 - t2 * 2)},${Math.round(251 - t2 * 161)})`
      } else {
        x.fillStyle = '#6e8efb'
      }
      x.beginPath(); x.arc(p.x, p.y, p.s, 0, Math.PI * 2); x.fill()
    }

    // Vortex center indicator
    if (md) {
      x.globalAlpha = 0.4
      x.strokeStyle = '#c4a35a'
      x.lineWidth = 1.5
      // Outer ring
      x.beginPath(); x.arc(mx, my, 150, 0, Math.PI * 2); x.stroke()
      // Inner ring
      x.globalAlpha = 0.6
      x.beginPath(); x.arc(mx, my, 8, 0, Math.PI * 2); x.stroke()
      // Center dot
      x.globalAlpha = 0.8; x.fillStyle = '#c4a35a'
      x.beginPath(); x.arc(mx, my, 3, 0, Math.PI * 2); x.fill()
    }

    // Hint
    if (t < 5) {
      x.globalAlpha = (1 - t / 5) * 0.5
      x.fillStyle = '#8a7e68'
      x.font = '10px "Instrument Sans",sans-serif'
      x.textAlign = 'center'
      x.fillText('hold mouse to create vortex', w / 2, h - 10)
    }
    x.globalAlpha = 1
  }
  reg(c, draw)
}

// ===== DEMO 5: Character Palette =====
function initCharPaletteDemo(): void {
  const { c, x, w, h } = mk('demo-palette')
  const chars = ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const gs = 20, cw = w / gs, ch2 = h / gs

  function draw(t: number): void {
    x.clearRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle'
    for (let gy = 0; gy < gs; gy++) {
      for (let gx = 0; gx < gs; gx++) {
        const nx = gx / gs, ny = gy / gs
        const d = clamp(0.5 + 0.3 * Math.sin(nx * 6 + t * 0.5) + 0.2 * Math.cos(ny * 8 - t * 0.3) + 0.15 * Math.sin((nx + ny) * 4 + t * 0.7), 0, 1)
        const ch = chars[Math.floor(d * (chars.length - 1))]
        x.globalAlpha = 0.2 + d * 0.7
        x.fillStyle = `rgb(${Math.round(lerp(110, 196, d))},${Math.round(lerp(142, 163, d))},${Math.round(lerp(251, 90, d))})`
        x.font = `${10 + d * 4}px "IBM Plex Mono",monospace`
        x.fillText(ch, gx * cw + cw / 2, gy * ch2 + ch2 / 2)
      }
    }
    if (t < 4) {
      x.globalAlpha = (1 - t / 4) * 0.4; x.fillStyle = '#8a7e68'
      x.font = '10px "Instrument Sans",sans-serif'; x.textAlign = 'center'
      x.fillText('density → character mapping', w / 2, h - 8)
    }
    x.globalAlpha = 1
  }
  reg(c, draw)
}

// ===== Main loop =====
function frame(ts: number): void {
  updateProgress(); updateSections(); updateFooter()
  for (const d of demos) {
    const r = d.canvas.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) d.draw(ts / 1000)
  }
  requestAnimationFrame(frame)
}

// ===== Init =====
document.addEventListener('mousedown', showFooter)
document.addEventListener('touchstart', showFooter, { passive: true })

function init(): void {
  try { initBoundaryWave() } catch { }
  try { initRippleDemo() } catch { }
  try { initCircularWaveDemo() } catch { }
  try { initVortexDemo() } catch { }
  try { initCharPaletteDemo() } catch { }
  requestAnimationFrame(frame)
}

if (document.readyState !== 'loading') init()
else document.addEventListener('DOMContentLoaded', init)
