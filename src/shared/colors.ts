// Ink & Vapor — Shared color utilities

import { lerp } from './utils'

export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}

export function rgbToString(c: RGB, alpha = 1): string {
  if (alpha === 1) return `rgb(${c.r},${c.g},${c.b})`
  return `rgba(${c.r},${c.g},${c.b},${alpha})`
}

export function rgbLerp(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  }
}

/** Create a Canvas linear gradient between two RGB colors */
export function createLinearGradient(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number,
  from: RGB,
  to: RGB,
  fromAlpha = 1,
  toAlpha = 1,
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, rgbToString(from, fromAlpha))
  gradient.addColorStop(1, rgbToString(to, toAlpha))
  return gradient
}
