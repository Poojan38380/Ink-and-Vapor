// Ink & Vapor — Vapor character palette
// Measures each character for width (pretext) and brightness (canvas scan)

import { prepareWithSegments } from '@chenglou/pretext'

const FONT_SIZE = 15
const PROP_FAMILY = 'Georgia, "Palatino Linotype", Palatino, serif'
const CHARSET = ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const WEIGHTS = [300, 500, 800] as const
const STYLES = ['normal', 'italic'] as const

const MEASURE_SIZE = 28
let _measureCanvas: HTMLCanvasElement | null = null
let _measureCtx: CanvasRenderingContext2D | null = null

function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    _measureCanvas = document.createElement('canvas')
    _measureCanvas.width = MEASURE_SIZE
    _measureCanvas.height = MEASURE_SIZE
    _measureCtx = _measureCanvas.getContext('2d', { willReadFrequently: true })!
  }
  return _measureCtx
}

function estimateBrightness(ch: string, font: string): number {
  const ctx = getMeasureCtx()
  ctx.clearRect(0, 0, MEASURE_SIZE, MEASURE_SIZE)
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, 1, MEASURE_SIZE / 2)
  const data = ctx.getImageData(0, 0, MEASURE_SIZE, MEASURE_SIZE).data
  let sum = 0
  for (let i = 3; i < data.length; i += 4) sum += data[i]
  return sum / (255 * MEASURE_SIZE * MEASURE_SIZE)
}

export interface VaporCharEntry {
  char: string
  weight: number
  style: 'normal' | 'italic'
  font: string
  width: number
  brightness: number
}

export function buildCharPalette(): VaporCharEntry[] {
  const entries: VaporCharEntry[] = []

  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const font = `${style === 'italic' ? 'italic ' : ''}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`
      for (const ch of CHARSET) {
        if (ch === ' ') continue
        const prepared = prepareWithSegments(ch, font)
        const width = prepared.widths.length > 0 ? prepared.widths[0] : 0
        if (width <= 0) continue
        const brightness = estimateBrightness(ch, font)
        entries.push({ char: ch, weight, style, font, width, brightness })
      }
    }
  }

  // Normalize brightness
  const maxB = Math.max(...entries.map(e => e.brightness))
  if (maxB > 0) for (const e of entries) e.brightness /= maxB

  // Sort by brightness for binary search
  entries.sort((a, b) => a.brightness - b.brightness)
  return entries
}

/** Find the best palette entry for a target brightness and width */
export function findBestChar(
  palette: VaporCharEntry[],
  targetBrightness: number,
  targetWidth: number,
): VaporCharEntry {
  // Binary search on brightness
  let lo = 0
  let hi = palette.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (palette[mid].brightness < targetBrightness) lo = mid + 1
    else hi = mid
  }

  // Search neighborhood for best combined score
  let bestScore = Infinity
  let best = palette[lo]
  const range = 15
  for (let i = Math.max(0, lo - range); i < Math.min(palette.length, lo + range); i++) {
    const p = palette[i]
    const bErr = Math.abs(p.brightness - targetBrightness) * 2.5
    const wErr = Math.abs(p.width - targetWidth) / targetWidth
    const score = bErr + wErr
    if (score < bestScore) {
      bestScore = score
      best = p
    }
  }
  return best
}

export const SPACE_WIDTH = FONT_SIZE * 0.27
