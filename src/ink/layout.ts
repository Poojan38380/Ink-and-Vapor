// Ink & Vapor — Ink layer: multi-column responsive text layout via pretext

import {
  prepareWithSegments,
  layoutNextLine,
  type LayoutCursor,
} from '@chenglou/pretext'

export interface InkLine {
  text: string
  x: number
  y: number
  width: number
  colIndex: number
}

export interface InkBlock {
  lines: InkLine[]
  totalHeight: number
  colStart: number
  colEnd: number
}

export interface InkLayout {
  headlineLine: string | null
  headlineX: number
  headlineY: number
  headlineWidth: number
  headlineFont: string
  body: InkBlock
  dropCap: {
    char: string
    x: number
    y: number
    font: string
  } | null
  columns: { left: number; right: number }[]
  /** The actual font used for body text (for char extraction) */
  bodyFont: string
  bodyLineHeight: number
}

const HEADLINE_TEXT = 'INK & VAPOR'
const BODY_TEXT =
  'The boundary between permanence and impermanence is a line you draw yourself. ' +
  'Below it, text settles like ink on paper — heavy, deliberate, carved into the page ' +
  'with the weight of centuries of typographic craft. Each letter occupies its space ' +
  'with the certainty of something that means to last.\n\n' +
  'Above the line, everything dissolves. Characters become particles, drifting on invisible ' +
  'currents, selected by the brightness of their shape and the density of the space around them. ' +
  'The same words that sit solid in the ink layer scatter like smoke in the vapor — ' +
  'readable near the boundary, abstract and distant as they rise.\n\n' +
  'This is what happens when you own the layout loop. No CSS constraints, no DOM reflow, ' +
  'no compromises. Every character is positioned by arithmetic. Every line is placed with intent. ' +
  'The text flows around obstacles because you control the geometry directly — not through ' +
  'the browser\'s layout engine, but through the same measurement API it uses internally.\n\n' +
  'Move the boundary and watch the transformation. Text crystallizes from vapor or dissolves ' +
  'into smoke depending on which side of the line it falls. Click to send ripples through ' +
  'the field. Drag to change where permanence ends and impermanence begins.\n\n' +
  'The web has been rendering text for thirty years through a pipeline designed for static ' +
  'documents. What if text could be alive? What if it could breathe, flow, scatter, ' +
  'and reform? What if the layout wasn\'t computed once at page load, but every frame, ' +
  'in response to every interaction?\n\n' +
  'Typography has always been about the relationship between form and meaning. ' +
  'The shapes of letters, the spaces between them, the rhythm of lines on a page — ' +
  'these are not decorative choices. They are the physical manifestation of thought made visible. ' +
  'When text flows around obstacles, it reveals the invisible architecture of reading itself.\n\n' +
  'In print, this was never a problem. The compositor arranged the type by hand, ' +
  'adjusting line breaks and spacing with human judgment. The page was a canvas, ' +
  'literally — a flat surface waiting for intention. On the web, we inherited the opposite model: ' +
  'a rigid pipeline that treats text as a black box, measuring nothing until it\'s too late.\n\n' +
  'But measurement without the DOM changes everything. The browser\'s canvas API knows ' +
  'exactly how wide every string will be before it\'s drawn. Cache those measurements once, ' +
  'and layout becomes pure arithmetic — fast enough to run every frame, responsive enough ' +
  'to react to every pixel of movement.\n\n' +
  'This is that question, answered on a canvas.'

function getResponsiveConfig() {
  const w = window.innerWidth
  if (w < 380) {
    return {
      headline: 'bold 18px "Playfair Display"',
      body: '12px Georgia',
      bodyLineHeight: 19,
      dropCap: 'bold 22px "Playfair Display"',
      marginXRatio: 0.05,
      headlineYRatio: 0.08,
      bodyTopExtra: 40,
      bodyBottomRatio: 0.82,
      colGap: 12,
      colThreshold: 9999,
    }
  }
  if (w < 600) {
    return {
      headline: 'bold 22px "Playfair Display"',
      body: '13px Georgia',
      bodyLineHeight: 20,
      dropCap: 'bold 26px "Playfair Display"',
      marginXRatio: 0.06,
      headlineYRatio: 0.07,
      bodyTopExtra: 45,
      bodyBottomRatio: 0.84,
      colGap: 16,
      colThreshold: 9999,
    }
  }
  if (w < 900) {
    return {
      headline: 'bold 52px "Playfair Display"',
      body: '16px Georgia',
      bodyLineHeight: 24,
      dropCap: 'bold 50px "Playfair Display"',
      marginXRatio: 0.07,
      headlineYRatio: 0.12,
      bodyTopExtra: 100,
      bodyBottomRatio: 0.88,
      colGap: 32,
      colThreshold: 900,
    }
  }
  return {
    headline: 'bold 72px "Playfair Display"',
    body: '17px Georgia',
    bodyLineHeight: 26,
    dropCap: 'bold 68px "Playfair Display"',
    marginXRatio: 0.08,
    headlineYRatio: 0.14,
    bodyTopExtra: 120,
    bodyBottomRatio: 0.90,
    colGap: 44,
    colThreshold: 900,
  }
}

export function createInkLayout(): InkLayout {
  const w = window.innerWidth
  const h = window.innerHeight
  const cfg = getResponsiveConfig()

  const marginX = w * cfg.marginXRatio
  const contentWidth = w - marginX * 2
  const bodyTop = cfg.headlineYRatio * h + cfg.bodyTopExtra
  const bodyBottom = h * cfg.bodyBottomRatio

  // Column count
  const colCount = contentWidth > cfg.colThreshold ? 2 : 1
  const totalGutter = colCount > 1 ? cfg.colGap : 0
  const totalContent = contentWidth - totalGutter
  const colWidth = totalContent / colCount

  const columns: { left: number; right: number }[] = []
  for (let i = 0; i < colCount; i++) {
    columns.push({
      left: marginX + i * (colWidth + cfg.colGap),
      right: marginX + i * (colWidth + cfg.colGap) + colWidth,
    })
  }

  // Headline
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = cfg.headline
  const headlineWidth = ctx.measureText(HEADLINE_TEXT).width
  const headlineX = (w - headlineWidth) / 2
  const headlineY = h * cfg.headlineYRatio

  // Drop cap
  const firstChar = BODY_TEXT[0]
  ctx.font = cfg.dropCap
  const dropCapW = ctx.measureText(firstChar).width
  const dropCapSize = cfg.bodyLineHeight * 3
  const dropCap = {
    char: firstChar,
    x: marginX - 2,
    y: bodyTop,
    font: cfg.dropCap,
  }
  const dropCapRight = marginX + dropCapW + 8

  // Prepare body text (skip first char for drop cap)
  const bodyTextWithoutDropCap = BODY_TEXT.slice(1)
  const prepared = prepareWithSegments(bodyTextWithoutDropCap, cfg.body)

  const allLines: InkLine[] = []
  let y = bodyTop
  let sharedCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let currentCol = 0

  while (y < bodyBottom) {
    const col = columns[currentCol]

    // Skip drop cap area in first column
    if (currentCol === 0 && y < bodyTop + dropCapSize) {
      const availW = col.right - dropCapRight
      if (availW > 40) {
        const line = layoutNextLine(prepared, sharedCursor, availW)
        if (line !== null) {
          allLines.push({
            text: line.text,
            x: dropCapRight,
            y,
            width: line.width,
            colIndex: currentCol,
          })
          sharedCursor = line.end
        }
      }
      y += cfg.bodyLineHeight
      continue
    }

    const line = layoutNextLine(prepared, sharedCursor, col.right - col.left)
    if (line === null) break

    allLines.push({
      text: line.text,
      x: col.left,
      y,
      width: line.width,
      colIndex: currentCol,
    })

    sharedCursor = line.end
    y += cfg.bodyLineHeight

    // Move to next column when filled
    if (currentCol < colCount - 1 && y >= bodyBottom - cfg.bodyLineHeight) {
      currentCol++
      y = bodyTop
    }
  }

  return {
    headlineLine: HEADLINE_TEXT,
    headlineX,
    headlineY,
    headlineWidth,
    headlineFont: cfg.headline,
    body: {
      lines: allLines,
      totalHeight: y - bodyTop,
      colStart: 0,
      colEnd: colCount,
    },
    dropCap,
    columns,
    bodyFont: cfg.body,
    bodyLineHeight: cfg.bodyLineHeight,
  }
}

// Export for debugging
export { HEADLINE_TEXT }
