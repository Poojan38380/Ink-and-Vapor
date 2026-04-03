// Ink & Vapor — Equations page
// Scroll reveals, progress bar, live wave canvas, sticky footer

import { clamp } from '../shared/utils'

const progressEl = document.getElementById('progress') as HTMLDivElement
const footerEl = document.getElementById('sticky-footer') as HTMLDivElement
const canvas = document.getElementById('wave-canvas') as HTMLCanvasElement
const sections = document.querySelectorAll<HTMLElement>('[data-section]')

let lastInteraction = 0
function showFooter(): void { lastInteraction = performance.now() / 1000 }
document.addEventListener('mousedown', showFooter)
document.addEventListener('touchstart', showFooter, { passive: true })

// --- Scroll progress ---
function updateProgress(): void {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = docHeight > 0 ? clamp(scrollTop / docHeight, 0, 1) : 0
  progressEl.style.width = `${progress * 100}%`
}

// --- Section reveal ---
function updateSections(): void {
  const triggerPoint = window.innerHeight * 0.85
  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    if (rect.top < triggerPoint) {
      section.classList.add('visible')
    }
  }
}

// --- Sticky footer ---
function updateFooter(): void {
  const now = performance.now() / 1000
  const elapsed = now - lastInteraction
  const visible = elapsed < 5
  footerEl.classList.toggle('visible', visible)
}

// --- Live Wave Canvas ---
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1
let cw = 0
let ch = 0

function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect()
  cw = rect.width
  ch = rect.height
  canvas.width = cw * dpr
  canvas.height = ch * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

// Wave config (matching the actual boundary wave)
interface WaveComp {
  a: number
  k: number
  w: number
  phi: number
  color: string
}

const components: WaveComp[] = [
  { a: 12, k: 0.008, w: 0.6, phi: 0, color: '#6e8efb88' },
  { a: 6, k: 0.018, w: 1.2, phi: Math.PI / 2, color: '#a777e388' },
  { a: 3, k: 0.035, w: 2.1, phi: Math.PI / 4, color: '#4ecdc488' },
]

function drawWave(time: number): void {
  ctx.clearRect(0, 0, cw, ch)
  const midY = ch / 2
  const pts = 300
  const dx = cw / (pts - 1)

  // Draw individual components
  for (const comp of components) {
    ctx.globalAlpha = 0.6
    ctx.strokeStyle = comp.color
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i <= pts; i++) {
      const x = i * dx
      const y = midY + comp.a * Math.sin(comp.k * x + comp.w * time + comp.phi)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Composite wave (all three superimposed)
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#d4c8a0'
  ctx.lineWidth = 2
  ctx.shadowColor = '#c4a35a44'
  ctx.shadowBlur = 8
  ctx.beginPath()
  for (let i = 0; i <= pts; i++) {
    const x = i * dx
    let y = midY
    for (const comp of components) {
      y += comp.a * Math.sin(comp.k * x + comp.w * time + comp.phi)
    }
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

// --- Main loop ---
function frame(timestamp: number): void {
  const time = timestamp / 1000
  updateProgress()
  updateSections()
  updateFooter()

  // Only draw canvas when visible (intersection observer optimization)
  const rect = canvas.getBoundingClientRect()
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    drawWave(time)
  }

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
