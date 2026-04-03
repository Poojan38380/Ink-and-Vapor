// Ink & Vapor — Transition engine: Ink ↔ Vapor morph per character

import type { Wave } from '../boundary/wave'
import type { Ripple } from '../boundary/ripple'
import { rippleDisplacement } from '../boundary/ripple'
import type { VaporCharEntry } from '../vapor/chars'
import type { VaporParticle } from '../vapor/particles'
import { rgbToString, type RGB } from '../shared/colors'

export interface CharState {
  /** The character */
  char: string
  /** Home position in the ink layout */
  homeX: number
  homeY: number
  /** Current animated position */
  x: number
  y: number
  /** 0 = pure vapor (dissolved), 1 = pure ink (solid) */
  inkness: number
  /** Velocity for crystallize/dissolve animation */
  vx: number
  vy: number
  /** Size scale (1.0 = normal) */
  scale: number
  /** Whether this character is currently transitioning */
  transitioning: boolean
  /** Optional per-character font override (e.g. for drop caps) */
  font?: string
}

export interface TransitionSystem {
  chars: CharState[]
  /** Font for measuring */
  font: string
  /** Dissolve speed (inkness → 0 per second) */
  dissolveSpeed: number
  /** Crystallize speed (inkness → 1 per second) */
  crystallizeSpeed: number
  /** Number of vapor particles spawned per dissolving char */
  dissolveParticleCount: number
}

export function createTransitionSystem(
  charPositions: { char: string; x: number; y: number; font?: string }[],
  font: string,
): TransitionSystem {
  const chars: CharState[] = charPositions.map(p => ({
    char: p.char,
    homeX: p.x,
    homeY: p.y,
    x: p.x,
    y: p.y,
    inkness: 1,
    vx: 0,
    vy: 0,
    scale: 1,
    transitioning: false,
    font: p.font,
  }))

  return {
    chars,
    font,
    dissolveSpeed: 2.2,
    crystallizeSpeed: 2.8,
    dissolveParticleCount: 0,
  }
}

/** Get boundary Y at a given X, including ripples */
function boundaryYAtX(
  wave: Wave,
  ripples: Ripple[],
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

/** Update transition system: dissolve/crystallize characters based on boundary position */
export function updateTransitions(
  sys: TransitionSystem,
  wave: Wave,
  ripples: Ripple[],
  time: number,
  dt: number,
): void {
  for (const ch of sys.chars) {
    // Determine if this character is above or below the boundary
    const boundary = boundaryYAtX(wave, ripples, ch.homeX, time)
    const aboveBoundary = ch.homeY < boundary

    if (aboveBoundary && ch.inkness > 0) {
      // Dissolve: inkness → 0
      ch.inkness = Math.max(0, ch.inkness - sys.dissolveSpeed * dt)
      ch.transitioning = ch.inkness > 0 && ch.inkness < 1
      // Drift upward as it dissolves
      ch.vy -= 200 * dt
      ch.y += ch.vy * dt
      ch.x += ch.vx * dt
      ch.vy *= 0.95
      ch.vx *= 0.95
    } else if (!aboveBoundary && ch.inkness < 1) {
      // Crystallize: inkness → 1
      ch.inkness = Math.min(1, ch.inkness + sys.crystallizeSpeed * dt)
      ch.transitioning = ch.inkness > 0 && ch.inkness < 1
      // Spring back to home
      const dx = ch.homeX - ch.x
      const dy = ch.homeY - ch.y
      ch.vx += dx * 40 * dt
      ch.vy += dy * 40 * dt
      ch.x += ch.vx * dt
      ch.y += ch.vy * dt
      ch.vx *= 0.88
      ch.vy *= 0.88
    } else if (!aboveBoundary && ch.inkness >= 1) {
      // Fully ink, sitting at home
      ch.inkness = 1
      ch.transitioning = false
      ch.x = ch.homeX
      ch.y = ch.homeY
      ch.vx = 0
      ch.vy = 0
      ch.scale = 1
    }

    // Scale effect during transition
    ch.scale = 0.7 + ch.inkness * 0.3
  }
}

/** Generate vapor particles from dissolving characters.
 *  Call once per frame for characters that are actively dissolving. */
export function spawnDissolveParticles(
  sys: TransitionSystem,
  particles: VaporParticle[],
  maxParticles: number,
  palette: VaporCharEntry[],
): void {
  for (const ch of sys.chars) {
    if (!ch.transitioning || ch.inkness > 0.3 || particles.length >= maxParticles) continue

    // Spawn a burst of vapor particles at this char's position
    const count = Math.ceil(sys.dissolveParticleCount * (1 - ch.inkness))
    for (let i = 0; i < count && particles.length < maxParticles; i++) {
      const entry = palette[Math.floor(Math.random() * palette.length)]
      particles.push({
        x: ch.x + (Math.random() - 0.5) * 8,
        y: ch.y + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 25,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.5 + Math.random() * 2,
        entry,
        brightness: 0.15 + Math.random() * 0.3,
        size: 0.7 + Math.random() * 0.5,
        rotation: (Math.random() - 0.5) * 30,
        rotationSpeed: (Math.random() - 0.5) * 20,
      })
    }
  }
}

/** Draw characters based on their inkness state */
export function drawTransitionChars(
  ctx: CanvasRenderingContext2D,
  sys: TransitionSystem,
  inkColor: RGB,
  vaporColor: RGB,
  globalAlpha: number,
): void {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  for (const ch of sys.chars) {
    if (ch.inkness < 0.01) continue

    const alpha = ch.inkness * globalAlpha * 0.85
    if (alpha < 0.02) continue

    // Color: mix between vapor color (dissolving) and ink color (solid)
    const color = ch.inkness > 0.5 ? inkColor : vaporColor
    const colorAlpha = ch.inkness > 0.5
      ? alpha
      : alpha * 0.8

    ctx.globalAlpha = colorAlpha
    ctx.fillStyle = rgbToString(color, 1)

    // Use per-character font if available (drop cap), otherwise system default
    ctx.font = ch.font ?? sys.font

    if (ch.inkness >= 0.99) {
      // Solid ink — crisp, at exact home position
      ctx.fillText(ch.char, ch.homeX, ch.homeY)
    } else {
      // Transitioning — slight glow for ethereal effect
      ctx.shadowColor = rgbToString(vaporColor, 0.3)
      ctx.shadowBlur = 6
      ctx.fillText(ch.char, ch.x, ch.y)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
  }

  ctx.globalAlpha = 1
}
