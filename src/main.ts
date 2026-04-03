// Ink & Vapor — Main entry point
// Phase 3: Boundary — animated, draggable, clickable wave line

import { createRenderer, render, addLayer, drawGlow } from './core/renderer'
import { createInput, resetFrameInput } from './core/input'
import { createTimer, tick } from './core/timer'
import { waitForFonts } from './core/fonts'
import { createInkLayout, BODY_FONT } from './ink/layout'
import { drawHeadline, drawBodyLines, drawDropCap } from './ink/typesetter'
import { midnightGalaxy, type Theme } from './themes/registry'
import { rgbToString, rgbLerp, lerpRGB } from './shared/colors'
import { clamp } from './shared/utils'
import {
  createWave,
  updateWaveBaseY
} from './boundary/wave'
import { createRipple, pruneRipples, rippleDisplacement } from './boundary/ripple'
import { createBoundaryDrag, startDrag, updateDrag, endDrag, applyDragSpring } from './boundary/drag'
import { drawBoundary } from './boundary/render'
import { buildCharPalette, type VaporCharEntry } from './vapor/chars'
import {
  createVaporSystem,
  updateVapor,
  setVaporMouse,
  setSpawnBoundary,
  burstVapor,
  type VaporSystem,
} from './vapor/particles'

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

  // Vapor system
  let charPalette: VaporCharEntry[] = []
  let vapor: VaporSystem

  window.addEventListener('resize', () => {
    inkLayout = createInkLayout()
    updateWaveBaseY(wave, renderer.height)
  })

  // Build character palette (requires fonts)
  charPalette = buildCharPalette()
  vapor = createVaporSystem(charPalette)
  setSpawnBoundary(vapor, wave.baseY)
  burstVapor(vapor, 800, renderer.width, renderer.height)

  console.log(`[vapor] palette: ${charPalette.length} chars, particles: ${vapor.particles.length}`)

  // Input: click → ripple, drag → move boundary
  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    const mx = e.clientX
    const my = e.clientY

    // Check if we can start a drag
    const hitBoundary = startDrag(
      drag, wave,
      mx, my,
      40, // tolerance in pixels — generous grab zone
      (x) => computeBoundaryY(wave, ripples, x, timer.elapsed),
    )

    if (!hitBoundary) {
      // Click away from boundary → spawn ripple
      ripples.push(createRipple(mx, timer.elapsed, 25))
    }
  })

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    updateDrag(drag, e.clientY, renderer.height)
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

  // --- Vapor layer (above boundary) ---
  addLayer(renderer, (ctx, time, dt) => {
    // Update mouse position for vapor
    setVaporMouse(
      vapor,
      input.mouse.x, input.mouse.y,
      input.mouse.down,
    )

    // Update vapor boundary tracking
    setSpawnBoundary(vapor, wave.baseY)

    // Step the system
    updateVapor(vapor, dt, time, renderer.width, renderer.height)

    // Draw particles
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    for (const p of vapor.particles) {
      // Fade in at birth, fade out at death
      let lifeAlpha = 1
      if (p.life > 0.9) lifeAlpha = (1 - p.life) / 0.1
      else if (p.life < 0.3) lifeAlpha = p.life / 0.3
      lifeAlpha = Math.max(0, Math.min(1, lifeAlpha))

      if (lifeAlpha < 0.05) continue

      // Color based on brightness: low brightness = boundary glow (cool), high = ink accent (warm)
      const b = p.brightness
      const color = lerpRGB(theme.boundaryGlow, theme.inkAccent, b * 1.5)

      ctx.globalAlpha = lifeAlpha * 0.65 * fadeInAlpha
      ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`
      ctx.font = p.entry.font
      ctx.fillText(p.entry.char, p.x, p.y)
    }
    ctx.globalAlpha = 1
  })
  addLayer(renderer, (ctx, time, dt) => {
    // Apply drag spring
    applyDragSpring(wave, drag, renderer.height, dt)

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
      50,
    )

    const ringRadius = isOverBoundary ? 24 : 16
    const ringAlpha = isOverBoundary ? 0.85 : 0.5
    const lineWidth = isOverBoundary ? 2.5 : 1.5

    // Outer ring
    ctx.globalAlpha = alpha * ringAlpha
    ctx.strokeStyle = rgbToString(theme.cursorColor)
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(input.mouse.x, input.mouse.y, ringRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Inner dot
    ctx.globalAlpha = alpha * 0.85
    ctx.fillStyle = rgbToString(theme.cursorColor)
    ctx.beginPath()
    ctx.arc(input.mouse.x, input.mouse.y, 3, 0, Math.PI * 2)
    ctx.fill()

    // When over boundary, show grab handles (small arcs)
    if (isOverBoundary) {
      ctx.globalAlpha = alpha * 0.5
      ctx.lineWidth = 1.5
      // Top arc
      ctx.beginPath()
      ctx.arc(input.mouse.x, input.mouse.y, ringRadius + 4, -0.4, 0.4)
      ctx.stroke()
      // Bottom arc
      ctx.beginPath()
      ctx.arc(input.mouse.x, input.mouse.y, ringRadius + 4, Math.PI - 0.4, Math.PI + 0.4)
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  })

  // Hide loading
  loadingEl.classList.add('hidden')

  // --- Main loop ---
  function frame(timestamp: number): void {
    tick(timer, timestamp)
    fadeInAlpha = clamp(fadeInAlpha + 0.02, 0, 1)

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
  const steps = 24
  const w = window.innerWidth
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w
    const y = computeBoundaryY(wave, ripples, x, time)
    if (Math.abs(my - y) < tolerance) return true
  }
  return false
}

/** Compute full boundary Y at a given X including wave + all ripples */
function computeBoundaryY(
  wave: ReturnType<typeof createWave>,
  ripples: ReturnType<typeof createRipple>[],
  x: number,
  time: number,
): number {
  const { amplitudes, frequencies, speeds, phases } = wave.config
  let y = wave.baseY +
    amplitudes[0] * wave.amplitudeMultiplier *
    Math.sin(frequencies[0] * x + speeds[0] * time * wave.speedMultiplier + phases[0]) +
    amplitudes[1] * wave.amplitudeMultiplier *
    Math.sin(frequencies[1] * x + speeds[1] * time * wave.speedMultiplier + phases[1]) +
    amplitudes[2] * wave.amplitudeMultiplier *
    Math.sin(frequencies[2] * x + speeds[2] * time * wave.speedMultiplier + phases[2])

  for (const r of ripples) {
    y += rippleDisplacement(r, x, time)
  }
  return y
}

main().catch((err) => {
  console.error('Ink & Vapor failed:', err)
  loadingEl.innerHTML = `<span style="color:#f55">Failed: ${err.message}</span>`
})
