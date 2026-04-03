// Ink & Vapor — Input handling: mouse, scroll, touch

export interface MouseState {
  x: number
  y: number
  prevX: number
  prevY: number
  down: boolean
  clicked: boolean
  dx: number
  dy: number
}

export interface ScrollState {
  delta: number
  total: number
}

export interface InputState {
  mouse: MouseState
  scroll: ScrollState
}

export function createInput(canvas: HTMLCanvasElement): InputState {
  const mouse: MouseState = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    prevX: window.innerWidth / 2,
    prevY: window.innerHeight / 2,
    down: false,
    clicked: false,
    dx: 0,
    dy: 0,
  }

  const scroll: ScrollState = {
    delta: 0,
    total: 0,
  }

  canvas.addEventListener('mousemove', (e) => {
    mouse.prevX = mouse.x
    mouse.prevY = mouse.y
    mouse.x = e.clientX
    mouse.y = e.clientY
    mouse.dx = mouse.x - mouse.prevX
    mouse.dy = mouse.y - mouse.prevY
  }, { passive: true })

  canvas.addEventListener('mousedown', () => {
    mouse.down = true
    mouse.clicked = true
  })

  window.addEventListener('mouseup', () => {
    mouse.down = false
  })

  window.addEventListener('wheel', (e) => {
    scroll.delta += e.deltaY
    scroll.total += e.deltaY
  }, { passive: true })

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    mouse.prevX = mouse.x
    mouse.prevY = mouse.y
    mouse.x = touch.clientX
    mouse.y = touch.clientY
    mouse.dx = mouse.x - mouse.prevX
    mouse.dy = mouse.y - mouse.prevY
  }, { passive: false })

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    mouse.x = touch.clientX
    mouse.y = touch.clientY
    mouse.down = true
    mouse.clicked = true
  })

  canvas.addEventListener('touchend', () => {
    mouse.down = false
  })

  return { mouse, scroll }
}

export function resetFrameInput(input: InputState): void {
  input.mouse.clicked = false
  input.mouse.dx = 0
  input.mouse.dy = 0
  input.scroll.delta = 0
}
