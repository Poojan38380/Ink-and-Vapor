// Ink & Vapor — Boundary rendering: glow, gradient stroke, sparkles

import type { Wave } from './wave'
import type { Ripple } from './ripple'
import type { RGB } from '../shared/colors'
import { rgbToString } from '../shared/colors'
import { rippleDisplacement } from './ripple'

const HORIZONTAL_RESOLUTION = 300 // points along the boundary line

export interface BoundaryRenderConfig {
  lineWidth: number
  glowRadius: number
  glowAlpha: number
  sparkleCount: number
  sparkleSizeMin: number
  sparkleSizeMax: number
}

export const defaultRenderConfig: BoundaryRenderConfig = {
  lineWidth: 1.5,
  glowRadius: 18,
  glowAlpha: 0.12,
  sparkleCount: 12,
  sparkleSizeMin: 1.5,
  sparkleSizeMax: 4,
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
  const w = window.innerWidth

  // Build points
  const points = buildWavePoints(wave, ripples, w, time)

  // 1. Glow: draw a thick soft path following the wave shape
  ctx.globalAlpha = c.glowAlpha
  ctx.strokeStyle = rgbToString(glowColor, 0.6)
  ctx.lineWidth = c.glowRadius * 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()

  // Second, tighter glow pass
  ctx.globalAlpha = c.glowAlpha * 0.6
  ctx.lineWidth = c.glowRadius
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // 2. Gradient stroke along the wave path
  // Create a gradient from left to right (horizontal)
  const strokeGrad = ctx.createLinearGradient(0, 0, w, 0)
  strokeGrad.addColorStop(0, rgbToString(color, 0.7))
  strokeGrad.addColorStop(0.5, rgbToString(glowColor, 0.5))
  strokeGrad.addColorStop(1, rgbToString(color, 0.6))

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

  // Secondary thin highlight
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = rgbToString(color, 0.5)
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // 3. Sparkles along the wave
  drawSparkles(ctx, points, time, c, glowColor)
}

/** Build the wave point list including ripple displacements */
function buildWavePoints(
  wave: Wave,
  ripples: Ripple[],
  width: number,
  time: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const dx = width / (HORIZONTAL_RESOLUTION - 1)

  for (let i = 0; i < HORIZONTAL_RESOLUTION; i++) {
    const x = i * dx
    let y = computeWaveY(wave, x, time)
    for (const r of ripples) {
      y += rippleDisplacement(r, x, time)
    }
    points.push({ x, y })
  }
  return points
}

/** Compute wave Y at a given X */
function computeWaveY(wave: Wave, x: number, time: number): number {
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

/** Draw sparkle particles along the wave */
function drawSparkles(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  time: number,
  config: BoundaryRenderConfig,
  color: RGB,
): void {
  const count = config.sparkleCount

  for (let i = 0; i < count; i++) {
    // Deterministic hash for consistent sparkle positions
    const hash = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const t = hash - Math.floor(hash)

    // Pick a point along the wave
    const idx = Math.floor(t * (points.length - 1))
    const point = points[Math.max(0, Math.min(points.length - 1, idx))]

    // Flicker with unique frequency per sparkle
    const flicker = Math.sin(time * (2.5 + i * 1.7) + i * 4.7) * 0.5 + 0.5
    const size = config.sparkleSizeMin + (config.sparkleSizeMax - config.sparkleSizeMin) * flicker
    const alpha = 0.25 + 0.55 * flicker

    // Only draw if sparkle is bright enough
    if (alpha < 0.35) continue

    ctx.globalAlpha = alpha
    ctx.fillStyle = rgbToString(color)

    // Draw as a small circle
    ctx.beginPath()
    ctx.arc(point.x, point.y, size * 0.6, 0, Math.PI * 2)
    ctx.fill()

    // Cross arms (only for brighter sparkles)
    if (flicker > 0.5) {
      ctx.globalAlpha = alpha * 0.5
      ctx.strokeStyle = rgbToString(color)
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(point.x - size * 1.2, point.y)
      ctx.lineTo(point.x + size * 1.2, point.y)
      ctx.moveTo(point.x, point.y - size * 1.2)
      ctx.lineTo(point.x, point.y + size * 1.2)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}
