// Ink & Vapor — Wave Demo: Interactive visualization of the wave systems

import { createRenderer, render, addLayer } from '../core/renderer'
import { createInput, resetFrameInput } from '../core/input'
import { createTimer, tick } from '../core/timer'
import { waitForFonts } from '../core/fonts'
import { createWave, updateWaveBaseY, waveYAtX } from '../boundary/wave'
import { createRipple, pruneRipples, rippleDisplacement, type Ripple } from '../boundary/ripple'
import { createBoundaryDrag, endDrag, applyDragSpring } from '../boundary/drag'
import { midnightGalaxy, goldenHour, oceanDepths, type Theme } from '../themes/registry'
import { rgbToString, rgbLerp } from '../shared/colors'
import { clamp } from '../shared/utils'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const loadingEl = document.getElementById('loading') as HTMLDivElement

const THEMES: Theme[] = [midnightGalaxy, goldenHour, oceanDepths]

async function main(): Promise<void> {
  await waitForFonts()

  const renderer = createRenderer(canvas)
  const input = createInput(canvas)
  const timer = createTimer()

  // Three demo sections stacked vertically
  const sections: { label: string; y: number; height: number }[] = []

  // Wave system
  const wave = createWave({ amplitudes: [18, 10, 5], baseYFraction: 0.35 })
  const drag = createBoundaryDrag()
  const ripples: Ripple[] = []
  updateWaveBaseY(wave, renderer.height)
  drag.targetFraction = wave.baseYFraction

  // Theme index
  let themeIndex = 0
  let theme = THEMES[0]
  let lastCircleClick = -1

  // Fade in
  let fadeInAlpha = 0

  // Layout on resize
  function updateLayout(): void {
    const h = renderer.height
    const third = h / 3
    sections.length = 0
    sections.push({ label: 'Boundary Wave', y: 0, height: third })
    sections.push({ label: 'Click Ripples', y: third, height: third })
    sections.push({ label: 'Circular Wave (Cursor)', y: third * 2, height: third })

    updateWaveBaseY(wave, renderer.height)
    // Position wave at middle of second section
    wave.baseY = third + third / 2
    wave.baseYFraction = (third + third / 2) / h
  }

  updateLayout()
  window.addEventListener('resize', updateLayout)

  // Click → ripple in section 2
  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    const mx = e.clientX
    const my = e.clientY
    const sec = sections[1]

    if (my >= sec.y && my < sec.y + sec.height) {
      ripples.push(createRipple(mx, timer.elapsed, 30))
    }

    // Click in section 3 → trigger circle pulse
    const sec3 = sections[2]
    if (my >= sec3.y && my < sec3.y + sec3.height) {
      lastCircleClick = timer.elapsed
    }

    // Double click → cycle theme
    if (e.detail === 2) {
      themeIndex = (themeIndex + 1) % THEMES.length
      theme = THEMES[themeIndex]
    }
  })

  window.addEventListener('mouseup', () => {
    endDrag(drag)
  })

  // --- Background layer ---
  addLayer(renderer, (ctx, time, _dt) => {
    const cx = renderer.width / 2
    const cy = renderer.height / 2
    const r = renderer.width * 0.7

    const pulse = Math.sin(time * 0.1) * 0.01
    const center = rgbLerp(theme.bgGradientCenter, theme.inkColor, 0.03 + pulse)

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    gradient.addColorStop(0, rgbToString(center))
    gradient.addColorStop(0.5, theme.bg)
    gradient.addColorStop(1, '#030305')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, renderer.width, renderer.height)
  })

  // --- Section dividers ---
  addLayer(renderer, (ctx, _time, _dt) => {
    ctx.globalAlpha = 0.15
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow, 0.3) : '#6e8efb44'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])

    for (let i = 1; i < sections.length; i++) {
      ctx.beginPath()
      ctx.moveTo(0, sections[i].y)
      ctx.lineTo(renderer.width, sections[i].y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  })

  // --- Section 1: Boundary Wave ---
  addLayer(renderer, (ctx, time, _dt) => {
    const sec = sections[0]
    const h = sec.height
    const y0 = sec.y

    // Update wave to center of section
    wave.baseY = y0 + h / 2
    wave.baseYFraction = wave.baseY / renderer.height

    // Apply drag spring
    applyDragSpring(wave, drag, renderer.height, timer.dt)
    pruneRipples(ripples, time)

    // Label
    ctx.globalAlpha = fadeInAlpha * 0.3
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.font = '12px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('BOUNDARY WAVE — 3-component sine composite. Drag to move.', 20, y0 + 12)
    ctx.globalAlpha = 1

    // Draw wave
    const w = renderer.width
    const pts = 200
    const dx = w / (pts - 1)

    // Fill area below wave
    ctx.globalAlpha = fadeInAlpha * 0.06
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.beginPath()
    ctx.moveTo(0, y0 + h)
    for (let i = 0; i < pts; i++) {
      const x = i * dx
      const y = waveYAtX(wave, x, time)
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, y0 + h)
    ctx.closePath()
    ctx.fill()

    // Wave line
    ctx.globalAlpha = fadeInAlpha * 0.7
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < pts; i++) {
      const x = i * dx
      const y = waveYAtX(wave, x, time)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Component waves (dashed, smaller)
    const compAmps = wave.config.amplitudes
    const compFreqs = wave.config.frequencies
    const compSpeeds = wave.config.speeds
    const compPhases = wave.config.phases
    const baseY = wave.baseY

    const colors = ['#ff6b6b88', '#ffd93d88', '#6bcb7788']
    const labels = ['Wave 1 (large)', 'Wave 2 (medium)', 'Wave 3 (fine)']

    for (let ci = 0; ci < 3; ci++) {
      ctx.globalAlpha = fadeInAlpha * 0.25
      ctx.strokeStyle = colors[ci]
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      for (let i = 0; i < pts; i++) {
        const x = i * dx
        const y = baseY + compAmps[ci] * Math.sin(compFreqs[ci] * x + compSpeeds[ci] * time * wave.speedMultiplier + compPhases[ci])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Label
      ctx.globalAlpha = fadeInAlpha * 0.2
      ctx.fillStyle = colors[ci]
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(labels[ci], w - 20, y0 + h - 10 - ci * 16)
    }
    ctx.globalAlpha = 1
  })

  // --- Section 2: Click Ripples ---
  addLayer(renderer, (ctx, time, _dt) => {
    const sec = sections[1]
    const h = sec.height
    const y0 = sec.y

    // Update wave to center
    wave.baseY = y0 + h / 2
    wave.baseYFraction = wave.baseY / renderer.height

    // Prune dead ripples
    pruneRipples(ripples, time)

    // Label
    ctx.globalAlpha = fadeInAlpha * 0.3
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.font = '12px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('CLICK RIPPLES — Click anywhere. Gaussian wavefront propagation.', 20, y0 + 12)
    ctx.globalAlpha = 1

    // Draw base wave
    const w = renderer.width
    const pts = 200
    const dx = w / (pts - 1)

    ctx.globalAlpha = fadeInAlpha * 0.15
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow, 0.3) : '#6e8efb44'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    for (let i = 0; i < pts; i++) {
      const x = i * dx
      const y = waveYAtX(wave, x, time)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Draw ripples on the wave
    ctx.globalAlpha = fadeInAlpha * 0.8
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < pts; i++) {
      const x = i * dx
      let y = waveYAtX(wave, x, time)
      for (const r of ripples) {
        y += rippleDisplacement(r, x, time)
      }
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Draw ripple centers
    for (const r of ripples) {
      const age = time - r.birthTime
      if (age < 0) continue
      const alpha = Math.max(0, Math.exp(-r.damping * age))
      if (alpha < 0.05) continue

      ctx.globalAlpha = fadeInAlpha * alpha * 0.3
      ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(r.originX, wave.baseY, r.speed * age, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })

  // --- Section 3: Circular Wave (Cursor) ---
  addLayer(renderer, (ctx, time, _dt) => {
    const sec = sections[2]
    const h = sec.height
    const y0 = sec.y

    const cx = input.mouse.x
    const cy = y0 + h / 2
    const baseRadius = 50
    const segments = 120

    // Click pulse
    const timeSinceClick = timer.elapsed - lastCircleClick
    const clickBurst = timeSinceClick < 0.6
      ? Math.exp(-timeSinceClick * 6) * 8
      : 0

    // Label
    ctx.globalAlpha = fadeInAlpha * 0.3
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.font = '12px Inter'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('CIRCULAR WAVE — Angular displacement. Click for pulse.', 20, y0 + 12)
    ctx.globalAlpha = 1

    // Wave parameters
    const waveAmp = 6
    const waveFreq = 7
    const waveSpeed = 2.0

    // Glow fill
    ctx.globalAlpha = fadeInAlpha * 0.05
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.beginPath()
    ctx.arc(cx, cy, baseRadius + 15, 0, Math.PI * 2)
    ctx.fill()

    // Wavy ring
    ctx.globalAlpha = fadeInAlpha * 0.7
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const displacement =
        waveAmp * Math.sin(angle * waveFreq + time * waveSpeed) +
        waveAmp * 0.5 * Math.cos(angle * waveFreq * 1.5 - time * waveSpeed * 0.7) +
        clickBurst * Math.sin(angle * 4 + time * 6)

      const r = baseRadius + displacement
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()

    // Expanding ripple ring
    if (clickBurst > 0.1) {
      const rippleRadius = baseRadius + clickBurst * 4
      ctx.globalAlpha = fadeInAlpha * clickBurst * 0.4
      ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Center dot
    const dotPulse = 1 + 0.3 * Math.sin(time * 2)
    const dotRadius = 3 * dotPulse + clickBurst * 2
    ctx.globalAlpha = fadeInAlpha * 0.8
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.beginPath()
    ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  })

  // --- Custom cursor ---
  addLayer(renderer, (ctx, time, _dt) => {
    if (fadeInAlpha < 0.3) return
    const mx = input.mouse.x
    const my = input.mouse.y
    const vw = renderer.width
    const baseRadius = vw < 900 ? 14 : vw < 1400 ? 18 : 22
    const segments = 60

    const timeSinceClick = timer.elapsed - lastCircleClick
    const clickBurst = timeSinceClick < 0.6 ? Math.exp(-timeSinceClick * 6) * 8 : 0

    const waveAmp = 2.5
    const waveFreq = 7
    const waveSpeed = 2.0

    ctx.globalAlpha = fadeInAlpha * 0.5
    ctx.strokeStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const displacement =
        waveAmp * Math.sin(angle * waveFreq + time * waveSpeed) +
        waveAmp * 0.5 * Math.cos(angle * waveFreq * 1.5 - time * waveSpeed * 0.7) +
        clickBurst * Math.sin(angle * 4 + time * 6)

      const r = baseRadius + displacement
      const x = mx + Math.cos(angle) * r
      const y = my + Math.sin(angle) * r

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.globalAlpha = fadeInAlpha * 0.7
    ctx.fillStyle = theme.boundaryGlow ? rgbToString(theme.boundaryGlow) : '#6e8efb'
    ctx.beginPath()
    ctx.arc(mx, my, 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  })

  // --- Sticky Footer (HTML, not canvas) ---
  const footerEl = document.getElementById('sticky-footer') as HTMLDivElement
  let lastInteraction = 0
  function showFooter(): void { lastInteraction = timer.elapsed }
  canvas.addEventListener('mousedown', showFooter)
  canvas.addEventListener('touchstart', showFooter, { passive: true })

  // Hide loading
  loadingEl.classList.add('hidden')

  // --- Main loop ---
  function frame(timestamp: number): void {
    tick(timer, timestamp)
    fadeInAlpha = clamp(fadeInAlpha + 0.02, 0, 1)

    // Footer visibility
    const timeSinceInteraction = timer.elapsed - lastInteraction
    const footerVisible = timeSinceInteraction < 5
    footerEl.classList.toggle('visible', footerVisible)

    render(renderer, timer.elapsed, timer.dt)
    resetFrameInput(input)

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

main().catch((err) => {
  console.error('Wave demo failed:', err)
  loadingEl.innerHTML = `<span style="color:#f55">Failed: ${err.message}</span>`
})
