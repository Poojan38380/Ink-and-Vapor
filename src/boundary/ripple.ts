// Ink & Vapor — Ripple: click-triggered wave propagation

export interface Ripple {
  /** Origin X position in pixels */
  originX: number
  /** Time of creation (seconds) */
  birthTime: number
  /** Initial amplitude in pixels */
  amplitude: number
  /** Propagation speed in pixels per second */
  speed: number
  /** Damping rate (per second) */
  damping: number
  /** Spatial decay width in pixels */
  spatialWidth: number
}

/** Create a new ripple at the given position and time */
export function createRipple(x: number, time: number, amplitude = 25): Ripple {
  return {
    originX: x,
    birthTime: time,
    amplitude,
    speed: 400,
    damping: 1.8,
    spatialWidth: 80,
  }
}

/** Compute the ripple's vertical displacement at a given X and time.
 *  Returns the Y offset to add to the base wave. */
export function rippleDisplacement(ripple: Ripple, x: number, time: number): number {
  const age = time - ripple.birthTime
  if (age < 0) return 0

  // Distance from origin
  const dist = Math.abs(x - ripple.originX)

  // Wavefront position
  const front = ripple.speed * age

  // Gaussian envelope: peak at wavefront, decays with distance from front
  const w = ripple.spatialWidth
  const envelope = Math.exp(-((dist - front) ** 2) / (2 * w * w))

  // Temporal decay
  const temporalDecay = Math.exp(-ripple.damping * age)

  // Oscillation at the wavefront
  const oscillation = Math.sin((dist - front) * 0.05)

  // Combined displacement
  return ripple.amplitude * envelope * temporalDecay * oscillation
}

/** Check if a ripple is still active */
export function isRippleActive(ripple: Ripple, time: number): boolean {
  const age = time - ripple.birthTime
  // Ripple is active if temporal decay hasn't reduced it below 1%
  return Math.exp(-ripple.damping * age) > 0.01
}

/** Update ripple array: remove inactive ripples */
export function pruneRipples(ripples: Ripple[], time: number): void {
  for (let i = ripples.length - 1; i >= 0; i--) {
    if (!isRippleActive(ripples[i], time)) {
      ripples.splice(i, 1)
    }
  }
}
