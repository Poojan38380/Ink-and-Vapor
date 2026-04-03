// Ink & Vapor — Main entry point
// Phase 3: Boundary — animated, draggable, clickable wave line

import { createRenderer, render, addLayer, drawGlow } from './core/renderer'
import { createInput, resetFrameInput } from './core/input'
import { createTimer, tick } from './core/timer'
import { waitForFonts } from './core/fonts'
import { createInkLayout, BODY_FONT } from './ink/layout'
import { drawHeadline, drawBodyLines, drawDropCap } from './ink/typesetter'
import { midnightGalaxy, type Theme } from './themes/registry'
import { rgbToString, rgbLerp } from './shared/colors'
import { clamp } from './shared/utils'
import { createWave, updateWaveBaseY } from './boundary/wave'
import { createRipple, pruneRipples } from './boundary/ripple'
import { createBoundaryDrag, startDrag, updateDrag, endDrag, applyDragSpring } from './boundary/drag'
import { drawBoundary } from './boundary/render'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const loadingEl = document.getElementById('loading') as HTMLDivElement

async function main(): Promise<void> {
  await waitForFonts()

  const renderer = createRenderer(canvas)
  const input = createInput(canvas)
  const timer = createTimer()

  const theme: Theme = midnightGalaxy
  let inkLayout = createInkLayout()
  let fadeInAlpha = 0

  // Boundary system
  const wave = createWave()
  const drag = createBoundaryDrag()
  const ripples: ReturnType<typeof createRipple>[] = []

  updateWaveBaseY(wave, renderer.height)
  drag.targetFraction = wave.baseYFraction

  window.addEventListener('resize', () => {
    inkLayout = createInkLayout()
    updateWaveBaseY(wave, renderer.height)
  })

  // Input: click → ripple, drag → move boundary
  canvas.addEventListener('mousedown', () => {
    // Check if we can start a drag
    const hitBoundary = startDrag(
      drag, wave,
      input.mouse.x, input.mouse.y,
      30, // tolerance in pixels
      (x) => waveYAtX(wave, x, timer.elapsed),
    )

    if (!hitBoundary) {
      // Click away from boundary → spawn ripple
      ripples.push(createRipple(input.mouse.x, timer.elapsed, 25))
    }
  })

  canvas.addEventListener('mousemove', () => {
    updateDrag(drag, input.mouse.y, renderer.height)
  })

  window.addEventListener('mouseup', () => {
    endDrag(drag)
  })

  // --- Background layer ---
  addLayer(renderer, (ctx, time, _dt) => {
    const cx = renderer.width / 2
    const cy = renderer.height * 0.4
    const r = renderer.width * 0.8
    const pulse = Math.sin(time * 0.12) * 0.01
    const center = rgbLerp(theme.bgGradientCenter, theme.inkColor, 0.03 + pulse)

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    gradient.addColorStop(0, rgbToString(center))
    gradient.addColorStop(0.5, theme.bg)
    gradient.addColorStop(1, rgbToString(rgbLerp(theme.bgGradientEdge, { r: 0, g: 0, b: 0 }, 0.5)))

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, renderer.width, renderer.height)

    // Vignette
    ctx.globalAlpha = 0.15
    const vignette = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.1)
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, renderer.width, renderer.height)
    ctx.globalAlpha = 1
  })

  // --- Ink layer ---
  addLayer(renderer, (ctx, time, _dt) => {
    const alpha = fadeInAlpha
    drawHeadline(ctx, inkLayout, time, theme.headlineColor, theme.headlineAccent, alpha)
    drawBodyLines(ctx, inkLayout.body.lines, BODY_FONT, theme.inkColor, alpha * 0.85)

    if (inkLayout.dropCap) {
      drawDropCap(
        ctx,
        inkLayout.dropCap.char,
        inkLayout.dropCap.x,
        inkLayout.dropCap.y,
        inkLayout.dropCap.font,
        theme.dropCapColor,
        alpha,
      )
    }

    // Subtle headline glow
    if (alpha > 0.3) {
      ctx.globalAlpha = alpha * 0.06
      drawGlow(
        ctx,
        inkLayout.headlineX + inkLayout.headlineWidth / 2,
        inkLayout.headlineY + 30,
        200,
        rgbToString(theme.headlineAccent),
      )
      ctx.globalAlpha = 1
    }
  })

  // --- Boundary layer ---
  addLayer(renderer, (ctx, time, dt) => {
    // Apply drag spring
    applyDragSpring(wave, drag, dt)

    // Prune dead ripples
    pruneRipples(ripples, time)

    // Draw boundary
    drawBoundary(ctx, wave, ripples, time, theme.boundaryColor, theme.boundaryGlow)
  })

  // --- Custom cursor ---
  addLayer(renderer, (ctx, time, _dt) => {
    const alpha = fadeInAlpha
    const isOverBoundary = isCursorNearBoundary(
      input.mouse.x, input.mouse.y,
      wave, ripples, time,
      30,
    )

    // Ring
    ctx.globalAlpha = alpha * (isOverBoundary ? 0.7 : 0.4)
    ctx.strokeStyle = rgbToString(theme.cursorColor)
    ctx.lineWidth = isOverBoundary ? 2 : 1.5
    ctx.beginPath()
    ctx.arc(input.mouse.x, input.mouse.y, isOverBoundary ? 22 : 18, 0, Math.PI * 2)
    ctx.stroke()

    // Inner dot
    ctx.globalAlpha = alpha * 0.7
    ctx.fillStyle = rgbToString(theme.cursorColor)
    ctx.beginPath()
    ctx.arc(input.mouse.x, input.mouse.y, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  })

  // Hide loading
  loadingEl.classList.add('hidden')

  // --- Main loop ---
  function frame(timestamp: number): void {
    tick(timer, timestamp)
    fadeInAlpha = clamp(fadeInAlpha + 0.012, 0, 1)

    render(renderer, timer.elapsed, timer.dt)
    resetFrameInput(input)

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

function isCursorNearBoundary(
  _mx: number, my: number,
  wave: ReturnType<typeof createWave>,
  ripples: ReturnType<typeof createRipple>[],
  time: number,
  tolerance: number,
): boolean {
  // Check a few sample points along X
  const steps = 20
  const w = window.innerWidth
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w
    let y = waveYAtX(wave, x, time)
    for (const r of ripples) {
      const age = time - r.birthTime
      if (age < 0) continue
      const dist = Math.abs(x - r.originX)
      const front = r.speed * age
      const ww = r.spatialWidth
      const envelope = Math.exp(-((dist - front) ** 2) / (2 * ww * ww))
      const decay = Math.exp(-r.damping * age)
      const osc = Math.sin((dist - front) * 0.05)
      y += r.amplitude * envelope * decay * osc
    }
    if (Math.abs(my - y) < tolerance) return true
  }
  return false
}

// Re-export from wave module
function waveYAtX(
  wave: ReturnType<typeof createWave>,
  x: number,
  time: number,
): number {
  const { amplitudes, frequencies, speeds, phases } = wave.config
  const baseY = wave.baseY
  return baseY +
    amplitudes[0] * wave.amplitudeMultiplier *
    Math.sin(frequencies[0] * x + speeds[0] * time * wave.speedMultiplier + phases[0]) +
    amplitudes[1] * wave.amplitudeMultiplier *
    Math.sin(frequencies[1] * x + speeds[1] * time * wave.speedMultiplier + phases[1]) +
    amplitudes[2] * wave.amplitudeMultiplier *
    Math.sin(frequencies[2] * x + speeds[2] * time * wave.speedMultiplier + phases[2])
}

main().catch((err) => {
  console.error('Ink & Vapor failed:', err)
  loadingEl.innerHTML = `<span style="color:#f55">Failed: ${err.message}</span>`
})
