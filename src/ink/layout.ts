// Ink & Vapor — Ink layer: multi-column text layout via pretext

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
  /** Which column range this block occupies */
  colStart: number
  colEnd: number
}

export interface InkLayout {
  headlineLine: string | null
  headlineX: number
  headlineY: number
  headlineWidth: number
  body: InkBlock
  dropCap: {
    char: string
    x: number
    y: number
    font: string
  } | null
  /** Column boundaries in pixel space */
  columns: { left: number; right: number }[]
}

const HEADLINE_TEXT = 'INK & VAPOR'
const HEADLINE_FONT = 'bold 72px "Playfair Display"'

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
  'This is that question, answered on a canvas.'

const BODY_FONT = '17px Georgia'
const BODY_LINE_HEIGHT = 26
const DROP_CAP_FONT = 'bold 68px "Playfair Display"'
const DROP_CAP_LINES = 3
const DROP_CAP_SIZE = DROP_CAP_LINES * BODY_LINE_HEIGHT
const COLUMN_GAP = 44
const MARGIN_X_RATIO = 0.08
const HEADLINE_Y_RATIO = 0.07

export function createInkLayout(): InkLayout {
  const w = window.innerWidth
  const h = window.innerHeight
  const marginX = w * MARGIN_X_RATIO
  const contentWidth = w - marginX * 2
  const bodyTop = HEADLINE_Y_RATIO * h + 90
  const bodyBottom = h - 30

  // --- Headline ---
  const ctx = document.createElement('canvas').getContext('2d')!
  ctx.font = HEADLINE_FONT
  const headlineWidth = ctx.measureText(HEADLINE_TEXT).width
  const headlineX = (w - headlineWidth) / 2
  const headlineY = h * HEADLINE_Y_RATIO

  // --- Drop cap ---
  const firstChar = BODY_TEXT[0]
  ctx.font = DROP_CAP_FONT
  const dropCapW = ctx.measureText(firstChar).width
  const dropCap = {
    char: firstChar,
    x: marginX - 2,
    y: bodyTop,
    font: DROP_CAP_FONT,
  }
  const dropCapRight = marginX + dropCapW + 8

  // --- Multi-column body layout ---
  const colCount = contentWidth > 900 ? 2 : 1
  const totalGutter = colCount > 1 ? COLUMN_GAP : 0
  const totalContent = contentWidth - totalGutter
  const colWidth = totalContent / colCount

  const columns: { left: number; right: number }[] = []
  for (let i = 0; i < colCount; i++) {
    columns.push({
      left: marginX + i * (colWidth + COLUMN_GAP),
      right: marginX + i * (colWidth + COLUMN_GAP) + colWidth,
    })
  }

  // Prepare the body text (skip first char since it's the drop cap)
  const bodyTextWithoutDropCap = BODY_TEXT.slice(1)
  const prepared = prepareWithSegments(bodyTextWithoutDropCap, BODY_FONT)

  const allLines: InkLine[] = []
  let y = bodyTop

  // Track which columns have been started
  const colCursor: LayoutCursor[] = []
  for (let i = 0; i < colCount; i++) {
    colCursor.push({ segmentIndex: 0, graphemeIndex: 0 })
  }

  // Simple layout: fill column 0, then column 1
  // For now, use a single shared cursor flowing across columns
  const sharedCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let currentCol = 0

  while (y < bodyBottom) {
    const col = columns[currentCol]
    const effectiveWidth = col.right - col.left

    // Skip drop cap area in first column
    if (currentCol === 0 && y < bodyTop + DROP_CAP_SIZE) {
      // Route around drop cap: check if this line band intersects drop cap
      const blockedRight = dropCapRight
      // If the line band intersects the drop cap rect, skip it
      if (y >= bodyTop && y < bodyTop + DROP_CAP_SIZE) {
        // Use only the right portion of the column
        const availW = col.right - blockedRight
        if (availW > 40) {
          const line = layoutNextLine(prepared, sharedCursor, availW)
          if (line !== null) {
            allLines.push({
              text: line.text,
              x: blockedRight,
              y,
              width: line.width,
              colIndex: currentCol,
            })
          }
        }
      }
      y += BODY_LINE_HEIGHT
      continue
    }

    const line = layoutNextLine(prepared, sharedCursor, effectiveWidth)
    if (line === null) break

    // Check for paragraph break (line starts with space or is short after previous line)
    allLines.push({
      text: line.text,
      x: col.left,
      y,
      width: line.width,
      colIndex: currentCol,
    })

    // Detect paragraph breaks (double newline in source)
    // Since pretext normalizes whitespace, we check for short lines followed by new column
    if (line.text.length < 5 && currentCol < colCount - 1) {
      // Could be a paragraph break — but we only switch column at bottom
      // For simplicity, stay in same column
    }

    y += BODY_LINE_HEIGHT

    // If we've filled this column, move to next
    if (currentCol < colCount - 1 && y >= bodyBottom - BODY_LINE_HEIGHT) {
      currentCol++
      y = bodyTop
    }
  }

  return {
    headlineLine: HEADLINE_TEXT,
    headlineX,
    headlineY,
    headlineWidth,
    body: {
      lines: allLines,
      totalHeight: y - bodyTop,
      colStart: 0,
      colEnd: colCount,
    },
    dropCap,
    columns,
  }
}

export { BODY_FONT, BODY_LINE_HEIGHT, HEADLINE_FONT, HEADLINE_TEXT }
