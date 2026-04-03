// Ink & Vapor — Shared utilities

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/** Map a value from one range to another (clamped) */
export function mapRange(
  val: number, inMin: number, inMax: number,
  outMin: number, outMax: number,
): number {
  const t = clamp((val - inMin) / (inMax - inMin), 0, 1)
  return lerp(outMin, outMax, t)
}

/** Smoothstep */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Ease in-out cubic */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Ease out cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Distance between two points */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/** Random float between min and max */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
