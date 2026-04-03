// Ink & Vapor — Boundary wave equation
// Composite of 3 sine waves, animated over time.

export interface WaveConfig {
  /** Base Y position as fraction of screen height (0-1) */
  baseYFraction: number
  /** Amplitude of each wave component (pixels) */
  amplitudes: [number, number, number]
  /** Frequency of each wave component (radians per pixel) */
  frequencies: [number, number, number]
  /** Animation speed of each wave (radians per second) */
  speeds: [number, number, number]
  /** Phase offset for each wave */
  phases: [number, number, number]
}

export const defaultWaveConfig: WaveConfig = {
  baseYFraction: 0.45,
  amplitudes: [12, 6, 3],
  frequencies: [0.008, 0.018, 0.035],
  speeds: [0.6, 1.2, 2.1],
  phases: [0, Math.PI * 0.5, Math.PI * 0.25],
}

export interface Wave {
  config: WaveConfig
  /** Current baseY in pixels (modified by drag) */
  baseY: number
  /** Current baseY fraction (0-1) */
  baseYFraction: number
  /** Speed multiplier applied to all wave speeds */
  speedMultiplier: number
  /** Amplitude multiplier applied to all amplitudes */
  amplitudeMultiplier: number
}

export function createWave(config?: Partial<WaveConfig>): Wave {
  const c = { ...defaultWaveConfig, ...config }
  return {
    config: c,
    baseY: 0,
    baseYFraction: c.baseYFraction,
    speedMultiplier: 1,
    amplitudeMultiplier: 1,
  }
}

/** Get the Y position of the wave at a given X coordinate and time */
export function waveYAtX(wave: Wave, x: number, time: number): number {
  const { amplitudes, frequencies, speeds, phases } = wave.config
  const y = wave.baseY

  return y +
    amplitudes[0] * wave.amplitudeMultiplier *
      Math.sin(frequencies[0] * x + speeds[0] * time * wave.speedMultiplier + phases[0]) +
    amplitudes[1] * wave.amplitudeMultiplier *
      Math.sin(frequencies[1] * x + speeds[1] * time * wave.speedMultiplier + phases[1]) +
    amplitudes[2] * wave.amplitudeMultiplier *
      Math.sin(frequencies[2] * x + speeds[2] * time * wave.speedMultiplier + phases[2])
}

/** Update wave base position (called on resize and drag) */
export function updateWaveBaseY(wave: Wave, screenHeight: number): void {
  wave.baseY = wave.baseYFraction * screenHeight
}

/** Set the base Y fraction (0 = top, 1 = bottom) */
export function setWaveBaseYFraction(wave: Wave, fraction: number): void {
  wave.baseYFraction = Math.max(0.1, Math.min(0.9, fraction))
}
