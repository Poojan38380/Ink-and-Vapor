// Ink & Vapor — Canvas 2D renderer with HiDPI support and layer system

export interface RenderLayer {
  draw: (ctx: CanvasRenderingContext2D, time: number, dt: number) => void
  visible: boolean
  alpha: number
}

export interface Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  dpr: number
  layers: RenderLayer[]
  backgroundColor: string
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1

  function resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    canvas,
    ctx,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr,
    layers: [],
    backgroundColor: '#06060f',
  }
}

export function addLayer(
  renderer: Renderer,
  draw: (ctx: CanvasRenderingContext2D, time: number, dt: number) => void,
  options?: { visible?: boolean; alpha?: number },
): RenderLayer {
  const layer: RenderLayer = {
    draw,
    visible: options?.visible ?? true,
    alpha: options?.alpha ?? 1,
  }
  renderer.layers.push(layer)
  return layer
}

export function render(renderer: Renderer, time: number, dt: number): void {
  const { ctx, width, height, backgroundColor, layers } = renderer

  renderer.width = window.innerWidth
  renderer.height = window.innerHeight

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  for (const layer of layers) {
    if (!layer.visible) continue
    ctx.globalAlpha = layer.alpha
    layer.draw(ctx, time, dt)
  }

  ctx.globalAlpha = 1
}

/** Draw a radial glow */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}
