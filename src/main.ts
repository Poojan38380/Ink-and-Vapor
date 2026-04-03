// Ink & Vapor — Main entry point
// Phase 3: Boundary — animated, draggable, clickable wave line

import { createRenderer, render, addLayer, drawGlow } from './core/renderer'
import { createInput, resetFrameInput } from './core/input'
import { createTimer, tick } from './core/timer'
import { waitForFonts } from './core/fonts'
import { createInkLayout } from './ink/layout'
import { drawHeadline } from './ink/typesetter'
import {
  createTransitionSystem,
  updateTransitions,
  spawnDissolveParticles,
  drawTransitionChars,
} from './ink/crystallize'
import { midnightGalaxy, type Theme } from './themes/registry'
import { rgbToString, rgbLerp, lerpRGB } from './shared/colors'
import { clamp } from './shared/utils'
import { boostField } from './shared/noise'
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
  repelFrom,
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

  // Transition system
  let transition: ReturnType<typeof createTransitionSystem>

  // Scroll turbulence
  let scrollTurbulence = 0 // decays over time

  window.addEventListener('resize', () => {
    inkLayout = createInkLayout()
    updateWaveBaseY(wave, renderer.height)

    // Rebuild transition system from new layout
    const newCharPositions: { char: string; x: number; y: number; font?: string }[] = []
    if (inkLayout.dropCap) {
      newCharPositions.push({
        char: inkLayout.dropCap.char,
        x: inkLayout.dropCap.x,
        y: inkLayout.dropCap.y + 60,
        font: inkLayout.dropCap.font,
      })
    }
    for (const line of inkLayout.body.lines) {
      const ctx = document.createElement('canvas').getContext('2d')!
      ctx.font = inkLayout.bodyFont
      let cursorX = line.x
      for (const ch of line.text) {
        const w = ctx.measureText(ch).width
        if (ch !== ' ') {
          newCharPositions.push({
            char: ch,
            x: cursorX,
            y: line.y + 20,
          })
        }
        cursorX += w
      }
    }
    transition = createTransitionSystem(newCharPositions, inkLayout.bodyFont)
  })

  // Build character palette (requires fonts)
  charPalette = buildCharPalette()
  vapor = createVaporSystem(charPalette)
  setSpawnBoundary(vapor, wave.baseY)
  // No burst — vapor comes ONLY from dissolving characters

  // Build transition system from ink layout characters
  const charPositions: { char: string; x: number; y: number; font?: string }[] = []

  // Include the drop cap as a transitionable character
  if (inkLayout.dropCap) {
    charPositions.push({
      char: inkLayout.dropCap.char,
      x: inkLayout.dropCap.x,
      y: inkLayout.dropCap.y + 60,
      font: inkLayout.dropCap.font,
    })
  }

  for (const line of inkLayout.body.lines) {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.font = inkLayout.bodyFont
    let cursorX = line.x
    for (const ch of line.text) {
      const w = ctx.measureText(ch).width
      if (ch !== ' ') {
        charPositions.push({
          char: ch,
          x: cursorX,
          y: line.y + 20, // offset from drawBodyLines
        })
      }
      cursorX += w
    }
  }
  transition = createTransitionSystem(charPositions, inkLayout.bodyFont)

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

  // Scroll → turbulence boost
  window.addEventListener('wheel', (e: WheelEvent) => {
    scrollTurbulence = Math.min(5, scrollTurbulence + Math.abs(e.deltaY) * 0.02)
  }, { passive: true })

  // Touch drag support for boundary (mobile)
  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    const t = e.touches[0]
    const mx = t.clientX
    const my = t.clientY
    const hitBoundary = startDrag(
      drag, wave,
      mx, my,
      50, // larger tolerance for touch
      (x) => computeBoundaryY(wave, ripples, x, timer.elapsed),
    )
    if (!hitBoundary) {
      ripples.push(createRipple(mx, timer.elapsed, 25))
    }
  }, { passive: true })

  canvas.addEventListener('touchmove', (e: TouchEvent) => {
    const t = e.touches[0]
    updateDrag(drag, t.clientY, renderer.height)
  }, { passive: true })

  canvas.addEventListener('touchend', () => {
    endDrag(drag)
  })

  // Double click → repulsion burst in vapor
  canvas.addEventListener('dblclick', (e: MouseEvent) => {
    const mx = e.clientX
    const my = e.clientY
    const boundary = computeBoundaryY(wave, ripples, mx, timer.elapsed)
    if (my < boundary + 100) {
      // Double click above boundary → repel vapor
      repelFrom(vapor, mx, my, 200, 3000)
    }
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
  addLayer(renderer, (ctx, time, dt) => {
    const alpha = fadeInAlpha
    drawHeadline(ctx, inkLayout, time, theme.headlineColor, theme.headlineAccent, alpha)

    // Update transitions
    updateTransitions(transition, wave, ripples, time, dt)

    // Spawn dissolve particles from transitioning chars
    spawnDissolveParticles(transition, vapor.particles, vapor.maxParticles, charPalette)

    // Draw transition-aware characters (replaces static body text)
    drawTransitionChars(ctx, transition, theme.inkColor, theme.boundaryGlow, alpha)

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
    // Decay scroll turbulence
    scrollTurbulence = Math.max(0, scrollTurbulence - dt * 0.8)

    // Apply turbulence boost to noise field
    if (scrollTurbulence > 0.1) {
      boostField(vapor.noise, 1 + scrollTurbulence)
    } else {
      boostField(vapor.noise, 1)
    }

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

  // --- Custom cursor: algorithmic circular wave ---
  // Hidden on touch devices. On desktop, a living ring that
  // breathes like the boundary wave and pulses on click.

  const isTouchDevice = 'ontouchstart' in window

  if (!isTouchDevice) {
    addLayer(renderer, (ctx, time, _dt) => {
      if (fadeInAlpha < 0.3) return
      const mx = input.mouse.x
      const my = input.mouse.y

      const isOverBoundary = isCursorNearBoundary(mx, my, wave, ripples, time, 50)
      const isDragging = drag.active
      const isClicked = input.mouse.clicked

      // Responsive base radius
      const vw = window.innerWidth
      const baseRadius = vw < 900 ? 14 : vw < 1400 ? 18 : 22
      const segments = 60

      // Circular wave displacement
      const waveAmp = isOverBoundary ? 5 : 2.5
      const waveFreq = 7 // wave peaks around the ring
      const waveSpeed = 2.0
      const clickPulse = isClicked ? 10 : 0

      // Wavy ring
      ctx.globalAlpha = fadeInAlpha * (isDragging ? 0.85 : isOverBoundary ? 0.7 : 0.45)
      ctx.strokeStyle = rgbToString(theme.cursorColor)
      ctx.lineWidth = isDragging ? 2.5 : isOverBoundary ? 2 : 1.2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        const displacement =
          waveAmp * Math.sin(angle * waveFreq + time * waveSpeed) +
          waveAmp * 0.5 * Math.cos(angle * waveFreq * 1.5 - time * waveSpeed * 0.7) +
          clickPulse * Math.exp(-((time * 4) % 1)) * Math.sin(angle * 3)

        const r = baseRadius + displacement
        const x = mx + Math.cos(angle) * r
        const y = my + Math.sin(angle) * r

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()

      // Outer glow ring (very subtle)
      ctx.globalAlpha = fadeInAlpha * 0.06
      ctx.strokeStyle = rgbToString(theme.cursorColor)
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.arc(mx, my, baseRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Inner breathing dot
      const dotPulse = 1 + 0.3 * Math.sin(time * 2)
      const dotRadius = 2 * dotPulse + (isClicked ? 4 : 0)
      ctx.globalAlpha = fadeInAlpha * 0.7
      ctx.fillStyle = rgbToString(theme.cursorColor)
      ctx.beginPath()
      ctx.arc(mx, my, dotRadius, 0, Math.PI * 2)
      ctx.fill()

      // Drag mode: vertical arrows
      if (isDragging) {
        ctx.globalAlpha = fadeInAlpha * 0.5
        ctx.lineWidth = 1.5
        const arrowSize = 5
        ctx.beginPath()
        ctx.moveTo(mx, my - baseRadius - 8)
        ctx.lineTo(mx - arrowSize, my - baseRadius - 8 + arrowSize)
        ctx.moveTo(mx, my - baseRadius - 8)
        ctx.lineTo(mx + arrowSize, my - baseRadius - 8 + arrowSize)
        ctx.moveTo(mx, my + baseRadius + 8)
        ctx.lineTo(mx - arrowSize, my + baseRadius + 8 - arrowSize)
        ctx.moveTo(mx, my + baseRadius + 8)
        ctx.lineTo(mx + arrowSize, my + baseRadius + 8 - arrowSize)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    })
  } else {
    // Touch device — hide custom cursor
    addLayer(renderer, (_ctx, _time, _dt) => {
      // No cursor on touch devices
    })
  }

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
