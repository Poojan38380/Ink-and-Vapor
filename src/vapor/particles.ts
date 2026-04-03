// Ink & Vapor — Vapor particle system

import type { NoiseField } from '../shared/noise'
import { flowAt, stepField } from '../shared/noise'
import type { VaporCharEntry } from './chars'
import { findBestChar, SPACE_WIDTH } from './chars'

export interface VaporParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number        // 0-1, decreases over time
  maxLife: number
  entry: VaporCharEntry
  brightness: number  // target brightness (0-1)
  size: number        // font size multiplier
  rotation: number    // subtle rotation in degrees
  rotationSpeed: number
}

export interface VaporSystem {
  particles: VaporParticle[]
  palette: VaporCharEntry[]
  noise: NoiseField
  /** Particle count target (actual count may vary due to lifecycle) */
  maxParticles: number
  /** Spawn rate per second */
  spawnRate: number
  /** Base Y for spawning (will be set to boundary position) */
  spawnBaseY: number
  /** Mouse attraction force */
  attractionStrength: number
  mouseX: number
  mouseY: number
  mouseActive: boolean
}

export function createVaporSystem(palette: VaporCharEntry[]): VaporSystem {
  return {
    particles: [],
    palette,
    noise: {
      scale: 200,
      octaves: 3,
      lacunarity: 2.2,
      gain: 0.5,
      timeSpeed: 0.08,
      zOffset: 0,
    },
    maxParticles: 1500,
    spawnRate: 0, // No ambient particles — vapor comes from dissolving chars only
    spawnBaseY: 0,
    attractionStrength: 800,
    mouseX: 0,
    mouseY: 0,
    mouseActive: false,
  }
}

function spawnParticle(
  sys: VaporSystem,
  w: number,
  h: number,
): VaporParticle {
  // Spawn near the boundary line with wider spread
  const x = Math.random() * w
  const y = sys.spawnBaseY + (Math.random() - 0.5) * 80

  // Determine brightness based on distance from boundary
  const distFromBoundary = Math.abs(y - sys.spawnBaseY)
  const brightness = Math.max(0.05, 0.6 - distFromBoundary / h * 3)

  const entry = findBestChar(sys.palette, brightness, SPACE_WIDTH)
  const maxLife = 1.5 + Math.random() * 2.5 // shorter life: 1.5–4s instead of 4–10s

  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 15,
    vy: -30 - Math.random() * 40, // drift upward
    life: 1,
    maxLife,
    entry,
    brightness,
    size: 0.8 + Math.random() * 0.5,
    rotation: (Math.random() - 0.5) * 20,
    rotationSpeed: (Math.random() - 0.5) * 15,
  }
}

/** Update the entire vapor system */
export function updateVapor(
  sys: VaporSystem,
  dt: number,
  _time: number,
  width: number,
  height: number,
): void {
  // Step noise field
  stepField(sys.noise, dt)

  // Spawn new particles
  const spawnCount = Math.floor(sys.spawnRate * dt)
  for (let i = 0; i < spawnCount && sys.particles.length < sys.maxParticles; i++) {
    sys.particles.push(spawnParticle(sys, width, height))
  }

  // Update existing particles
  for (let i = sys.particles.length - 1; i >= 0; i--) {
    const p = sys.particles[i]

    // Flow field force
    const [fx, fy] = flowAt(sys.noise, p.x, p.y)
    p.vx += fx * 250 * dt
    p.vy += fy * 250 * dt

    // Upward drift (vapor rises)
    p.vy -= 8 * dt

    // Mouse attraction
    if (sys.mouseActive) {
      const dx = sys.mouseX - p.x
      const dy = sys.mouseY - p.y
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)
      if (dist > 5 && dist < 250) {
        const force = sys.attractionStrength * (1 - dist / 250) / dist
        p.vx += dx * force * dt
        p.vy += dy * force * dt
      }
    }

    // Damping
    p.vx *= 0.97
    p.vy *= 0.97

    // Integrate
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rotation += p.rotationSpeed * dt

    // Life decay
    p.life -= dt / p.maxLife

    // Kill dead particles
    if (p.life <= 0 || p.y < -50 || p.y > height + 50 || p.x < -50 || p.x > width + 50) {
      sys.particles.splice(i, 1)
    }
  }
}

/** Set the mouse position for attraction */
export function setVaporMouse(
  sys: VaporSystem,
  x: number,
  y: number,
  active: boolean,
): void {
  sys.mouseX = x
  sys.mouseY = y
  sys.mouseActive = active
}

/** Click repulsion: push all nearby particles away from a point */
export function repelFrom(
  sys: VaporSystem,
  x: number,
  y: number,
  radius: number,
  force: number,
): void {
  for (const p of sys.particles) {
    const dx = p.x - x
    const dy = p.y - y
    const distSq = dx * dx + dy * dy
    const dist = Math.sqrt(distSq)
    if (dist > 2 && dist < radius) {
      const strength = force * (1 - dist / radius) / dist
      p.vx += dx * strength
      p.vy += dy * strength
    }
  }
}

/** Set the spawn boundary Y */
export function setSpawnBoundary(sys: VaporSystem, baseY: number): void {
  sys.spawnBaseY = baseY
}

/** Spawn an initial burst of particles (for immediate visual feedback) */
export function burstVapor(
  sys: VaporSystem,
  count: number,
  width: number,
  height: number,
): void {
  for (let i = 0; i < count && sys.particles.length < sys.maxParticles; i++) {
    const p = spawnParticle(sys, width, height)
    // Stagger their life so they don't all die at once
    p.life = 0.3 + Math.random() * 0.7
    p.maxLife = 3 + Math.random() * 5
    sys.particles.push(p)
  }
}
