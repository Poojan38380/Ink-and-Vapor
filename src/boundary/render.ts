// Ink & Vapor — Boundary rendering: glow, gradient stroke, sparkles

import type { Wave } from './wave'
import type { Ripple } from './ripple'
import type { RGB } from '../shared/colors'
import { rgbToString, createLinearGradient } from '../shared/colors'
import { rippleDisplacement } from './ripple'

const HORIZONTAL_RESOLUTION = 300 // points along the boundary line

export interface BoundaryRenderConfig {
  /** Line thickness in pixels */
  lineWidth: number
  /** Glow radius in pixels */
  glowRadius: number
  /** Glow alpha (0-1) */
  glowAlpha: number
  /** Sparkle count per render */
  sparkleCount: number
  /** Sparkle size range [min, max] */
  sparkleSizeMin: number
  sparkleSizeMax: number
}

export const defaultRenderConfig: BoundaryRenderConfig = {
  lineWidth: 1.5,
  glowRadius: 18,
  glowAlpha: 0.15,
  sparkleCount: 8,
  sparkleSizeMin: 1,
  sparkleSizeMax: 3,
}

/** Draw the boundary line with glow and sparkles */
export function drawBoundary(
  ctx: CanvasRenderingContext2D,
  wave: Wave,
  ripples: Ripple[],
  time: number,
  color: RGB,
  glowColor: RGB,
  config?: Partial<BoundaryRenderConfig>,
): void {
  const c = { ...defaultRenderConfig, ...config }
  const w = ctx.canvas.width / (window.devicePixelRatio || 1)

  // Build points
  const points: { x: number; y: number }[] = []
  const dx = w / (HORIZONTAL_RESOLUTION - 1)

  for (let i = 0; i < HORIZONTAL_RESOLUTION; i++) {
    const x = i * dx
    let y = waveYAtXWithRipples(wave, ripples, x, time)
    points.push({ x, y })
  }

  // Outer glow
  ctx.globalAlpha = c.glowAlpha
  const glowGradient = ctx.createRadialGradient(
    w / 2, wave.baseY, 0,
    w / 2, wave.baseY, w * 0.5,
  )
  glowGradient.addColorStop(0, rgbToString(glowColor, 0.4))
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, wave.baseY - c.glowRadius * 3, w, c.glowRadius * 6)
  ctx.globalAlpha = 1

  // Gradient stroke along the line
  const strokeGrad = createLinearGradient(
    ctx, 0, wave.baseY, w, wave.baseY,
    color,
    glowColor,
    0.6,
    0.4,
  )

  ctx.strokeStyle = strokeGrad
  ctx.lineWidth = c.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()

  // Secondary thinner highlight
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = rgbToString(color, 0.5)
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // Sparkles along the line
  drawSparkles(ctx, points, time, c, glowColor)
}

/** Get wave Y at X including all ripple displacements */
function waveYAtXWithRipples(
  wave: Wave,
  ripples: Ripple[],
  x: number,
  time: number,
): number {
  let y = waveYAtX(wave, x, time)
  for (const ripple of ripples) {
    y += rippleDisplacement(ripple, x, time)
  }
  return y
}

// Re-export from wave module (we need waveYAtX here)
function waveYAtX(wave: Wave, x: number, time: number): number {
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

/** Draw sparkle particles along the boundary */
function drawSparkles(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  time: number,
  config: BoundaryRenderConfig,
  color: RGB,
): void {
  // Use seeded randomness based on time for consistent sparkle positions
  const count = config.sparkleCount
  for (let i = 0; i < count; i++) {
    // Hash function for deterministic sparkle placement
    const hash = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const t = hash - Math.floor(hash)

    // Pick a point along the line
    const idx = Math.floor(t * (points.length - 1))
    const point = points[Math.max(0, Math.min(points.length - 1, idx))]

    // Flicker
    const flicker = Math.sin(time * (2 + i * 1.3) + i * 4.7) * 0.5 + 0.5
    const size = config.sparkleSizeMin + (config.sparkleSizeMax - config.sparkleSizeMin) * flicker
    const alpha = 0.3 + 0.5 * flicker

    ctx.globalAlpha = alpha
    ctx.fillStyle = rgbToString(color)

    // Draw as a tiny cross/star
    ctx.beginPath()
    ctx.arc(point.x, point.y, size * 0.5, 0, Math.PI * 2)
    ctx.fill()

    // Tiny cross arms
    ctx.globalAlpha = alpha * 0.4
    ctx.lineWidth = 0.5
    ctx.strokeStyle = rgbToString(color)
    ctx.beginPath()
    ctx.moveTo(point.x - size, point.y)
    ctx.lineTo(point.x + size, point.y)
    ctx.moveTo(point.x, point.y - size)
    ctx.lineTo(point.x, point.y + size)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
