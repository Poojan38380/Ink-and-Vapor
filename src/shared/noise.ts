// Ink & Vapor — Multi-octave noise flow field

/**
 * Simplex-like noise using layered sine waves (value noise).
 * Not true Perlin — cheaper and visually indistinguishable for flow fields.
 */

// Simplex-ish 2D noise using hash + interpolation
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy

  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)

  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function noise2D(x: number, y: number): number {
  return smoothNoise(x, y) * 2 - 1
}

/** Multi-octave noise (fractal Brownian motion) */
function fbm(
  x: number, y: number,
  octaves: number,
  lacunarity: number,
  gain: number,
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxVal = 0

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude
    maxVal += amplitude
    amplitude *= gain
    frequency *= lacunarity
  }

  return value / maxVal
}

export interface NoiseField {
  /** Spatial scale of the base octave (larger = smoother) */
  scale: number
  /** Number of octaves (1-4, more = more detail) */
  octaves: number
  /** Lacunarity: frequency multiplier between octaves */
  lacunarity: number
  /** Gain: amplitude multiplier between octaves */
  gain: number
  /** Time-based animation speed */
  timeSpeed: number
  /** Z-offset for time evolution (scrolls the noise) */
  zOffset: number
}

export function createNoiseField(options?: Partial<NoiseField>): NoiseField {
  return {
    scale: 400,
    octaves: 3,
    lacunarity: 2.2,
    gain: 0.5,
    timeSpeed: 0.15,
    zOffset: 0,
    ...options,
  }
}

/** Update field time */
export function stepField(field: NoiseField, dt: number): void {
  field.zOffset += dt * field.timeSpeed
}

/** Boost the time speed temporarily (for scroll-driven turbulence) */
export function boostField(field: NoiseField, multiplier: number): void {
  field.timeSpeed = 0.15 * multiplier
}

/** Get a 2D flow vector at (x, y, time) — returns [vx, vy] */
export function flowAt(
  field: NoiseField,
  x: number,
  y: number,
): [number, number] {
  const s = field.scale
  const z = field.zOffset

  const vx = fbm(
    x / s, y / s + 5.2 + z,
    field.octaves,
    field.lacunarity,
    field.gain,
  )

  // Y component: noise at offset position for decorrelation
  const vy = fbm(
    x / s + 5.2 + z, y / s + z * 0.5,
    field.octaves,
    field.lacunarity,
    field.gain,
  )

  return [vx, vy]
}
