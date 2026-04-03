// Ink & Vapor — Ink typesetter: per-character rendering with gradients

import type { InkLayout, InkLine } from './layout'
import type { RGB } from '../shared/colors'
import { rgbToString, createLinearGradient } from '../shared/colors'

export interface CharInfo {
  char: string
  x: number
  y: number
  width: number
  baseAlpha: number
}

/** Extract per-character positions from a line of text */
export function extractChars(
  line: InkLine,
  font: string,
): CharInfo[] {
  const chars: CharInfo[] = []
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = font

  let cursorX = line.x
  for (const ch of line.text) {
    const w = ctx.measureText(ch).width
    chars.push({
      char: ch === ' ' ? '\u00A0' : ch,
      x: cursorX,
      y: line.y,
      width: w,
      baseAlpha: 0.82,
    })
    cursorX += w
  }
  return chars
}

/** Draw the headline with animated gradient fill */
export function drawHeadline(
  ctx: CanvasRenderingContext2D,
  layout: InkLayout,
  time: number,
  inkColor: RGB,
  inkAccent: RGB,
  alpha: number,
): void {
  if (!layout.headlineLine) return

  const w = layout.headlineWidth
  const x = layout.headlineX
  const y = layout.headlineY

  // Animated gradient
  const shift = Math.sin(time * 0.4) * 0.08
  const gradient = createLinearGradient(
    ctx, x, y, x + w, y,
    inkColor,
    inkAccent,
    alpha * (0.85 + shift),
    alpha * (0.75 - shift),
  )

  ctx.fillStyle = gradient
  ctx.font = layout.headlineFont
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Subtle text shadow — scaled down on mobile
  const vw = window.innerWidth
  const blur = vw < 600 ? 3 : 8
  const offsetY = vw < 600 ? 1 : 2
  ctx.shadowColor = rgbToString(inkColor, vw < 600 ? 0.08 : 0.15)
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = offsetY

  ctx.fillText(layout.headlineLine, x, y)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/** Draw body text lines with theme colors */
export function drawBodyLines(
  ctx: CanvasRenderingContext2D,
  lines: InkLine[],
  font: string,
  color: RGB,
  alpha: number,
): void {
  ctx.fillStyle = rgbToString(color, alpha)
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  for (const line of lines) {
    ctx.fillText(line.text, line.x, line.y + 20)
  }
}

/** Draw the drop cap with emphasis */
export function drawDropCap(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  font: string,
  color: RGB,
  alpha: number,
): void {
  ctx.fillStyle = rgbToString(color, alpha * 0.95)
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Slight shadow for depth
  ctx.shadowColor = rgbToString(color, 0.2)
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  ctx.fillText(char, x, y + 60)

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}
