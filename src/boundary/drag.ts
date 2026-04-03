// Ink & Vapor — Boundary drag: mouse-driven boundary repositioning
import { type Wave } from './wave'

export interface BoundaryDrag {
  /** Whether the user is currently dragging the boundary */
  active: boolean
  /** Target baseY fraction (where the user is dragging to) */
  targetFraction: number
  /** Spring stiffness for smooth follow */
  springK: number
  /** Damping for spring */
  damping: number
}

export function createBoundaryDrag(): BoundaryDrag {
  return {
    active: false,
    targetFraction: 0.45,
    springK: 8,
    damping: 0.85,
  }
}

/** Start dragging: check if mouse is near the boundary line */
export function startDrag(
  drag: BoundaryDrag,
  wave: Wave,
  mouseX: number,
  mouseY: number,
  tolerance: number,
  waveYFn: (x: number) => number,
): boolean {
  const boundaryY = waveYFn(mouseX)
  if (Math.abs(mouseY - boundaryY) < tolerance) {
    drag.active = true
    drag.targetFraction = wave.baseYFraction
    return true
  }
  return false
}

/** Update drag target based on mouse Y */
export function updateDrag(
  drag: BoundaryDrag,
  mouseY: number,
  screenHeight: number,
): void {
  if (!drag.active) return
  drag.targetFraction = Math.max(0.1, Math.min(0.9, mouseY / screenHeight))
}

/** End drag */
export function endDrag(drag: BoundaryDrag): void {
  drag.active = false
}

/** Apply spring physics to smoothly move boundary toward target */
export function applyDragSpring(wave: Wave, drag: BoundaryDrag, dt: number): void {
  if (!drag.active) return

  const diff = drag.targetFraction - wave.baseYFraction
  wave.baseYFraction += diff * drag.springK * dt
  wave.baseYFraction = Math.max(0.1, Math.min(0.9, wave.baseYFraction))
}
