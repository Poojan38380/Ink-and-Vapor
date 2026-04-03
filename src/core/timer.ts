// Ink & Vapor — Timer: delta-time clock and global elapsed time

export interface Timer {
  /** Total elapsed time in seconds */
  elapsed: number
  /** Delta time since last frame in seconds (capped at 50ms) */
  dt: number
  /** Current frame timestamp */
  now: number
}

export function createTimer(): Timer {
  return {
    elapsed: 0,
    dt: 0,
    now: performance.now(),
  }
}

export function tick(timer: Timer, timestamp: number): void {
  const raw = (timestamp - timer.now) / 1000
  timer.dt = Math.min(raw, 0.05)
  timer.elapsed += timer.dt
  timer.now = timestamp
}
