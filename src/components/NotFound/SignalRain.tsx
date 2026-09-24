import { useEffect, useRef } from 'react'

const WIDTH = 720
const HEIGHT = 339
const FRAME_MS = 40

type Particle = {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  color: string
  glyph?: string
}

// Positions and colors use the 720 × 375 reference's inner artboard.
const COLUMNS: [x: number, width: number, color: string][] = [
  [74, 9, '#30242d'],
  [129, 32, '#2c202c'],
  [160, 25, '#1c242c'],
  [186, 24, '#242c34'],
  [194, 9, '#322a33'],
  [211, 7, '#1c242c'],
  [269, 8, '#2c202c'],
  [277, 7, '#262b37'],
  [421, 8, '#2c202c'],
  [430, 12, '#1c242c'],
  [442, 64, '#242c34'],
  [506, 19, '#322a33'],
  [525, 12, '#391e2b'],
  [537, 10, '#1c2028'],
  [559, 9, '#2c202c'],
  [592, 8, '#1c242c'],
  [600, 49, '#242c34'],
  [649, 9, '#1c242c'],
  [668, 14, '#322028'],
  [682, 17, '#2c202c'],
]

function createParticles(): Particle[] {
  // A fixed seed keeps placement stable across resizes and React remounts.
  let seed = 404
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 0x1_0000_0000
  }
  const particles: Particle[] = (
    [
      [468, 45, 7, 0.72, '#ff283c'],
      [504, 122, 7, 0.6, '#ff283c'],
      [452, 213, 7, 0.4, '#ff283c'],
      [422, 49, 5, 0.8, '#d4d8db'],
      [612, 40, 5, 0.82, '#d4d8db'],
      [615, 120, 5, 0.8, '#d4d8db'],
      [55, 8, 5, 0.6, '#d4d8db'],
    ] as const
  ).map(([x, y, size, opacity, color]) => ({ x, y, size, opacity, color, speed: 45 }))

  for (let index = 0; index < 170; index++) {
    const dense = index < 80
    const x = dense ? 421 + random() * 112 : random() * WIDTH
    const red = random() < 0.19
    particles.push({
      x,
      y: random() * 420 - 40,
      size: 1.2 + random() ** 2 * 5.4,
      speed: 25 + random() * 24,
      opacity: 0.13 + random() * 0.36,
      color: red ? '#ff283c' : '#929eaf',
    })
  }

  const lanes = [
    { x: 448, glyphs: 'j0j0j', size: 13, speed: 44, spacing: 81, offset: 17 },
    { x: 474, glyphs: '0j00', size: 12, speed: 41, spacing: 83, offset: 151 },
    { x: 504, glyphs: '00000', size: 13, speed: 48, spacing: 73, offset: 29 },
    { x: 511, glyphs: '0000', size: 10, speed: 43, spacing: 85, offset: 15 },
    { x: 527, glyphs: 'gdgdg', size: 10, speed: 33, spacing: 83, offset: 60 },
    { x: 558, glyphs: 'gdgd', size: 9, speed: 35, spacing: 89, offset: 148 },
    { x: 601, glyphs: 'YtYtY', size: 14, speed: 44, spacing: 72, offset: 65 },
    { x: 622, glyphs: '00000', size: 14, speed: 46, spacing: 69, offset: 43 },
    { x: 640, glyphs: 'SSSSS', size: 13, speed: 42, spacing: 70, offset: 11 },
    { x: 194, glyphs: 't101', size: 7, speed: 28, spacing: 42, offset: 13 },
    { x: 288, glyphs: 'g0dg', size: 9, speed: 29, spacing: 93, offset: 128 },
  ]

  for (const lane of lanes) {
    for (let index = 0; index < lane.glyphs.length; index++) {
      particles.push({
        x: lane.x + (random() - 0.5) * 9,
        y: (lane.offset + index * lane.spacing) % 390,
        size: lane.size,
        speed: lane.speed,
        opacity: lane.x < 420 ? 0.3 : 0.57 + random() * 0.25,
        color: lane.glyphs[index] === 'Y' ? '#647896' : '#a1a7b0',
        glyph: lane.glyphs[index],
      })
    }
  }

  for (const [x, y] of [
    [90, 37],
    [2, 86],
    [433, 6],
    [469, 48],
    [33, 133],
    [674, 96],
  ]) {
    particles.push({
      x,
      y,
      size: 5,
      speed: 12,
      opacity: 0.55,
      color: '#ff283c',
      glyph: '404',
    })
  }

  return particles
}

function paintBackdrop(context: CanvasRenderingContext2D, height: number) {
  const base = context.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, '#182028')
  base.addColorStop(0.55, '#181c28')
  base.addColorStop(1, '#141824')
  context.fillStyle = base
  context.fillRect(0, 0, WIDTH, height)

  for (const [x, width, color] of COLUMNS) {
    const column = context.createLinearGradient(0, 0, 0, height)
    column.addColorStop(0, color)
    column.addColorStop(1, '#141824')
    context.fillStyle = column
    context.fillRect(x, 0, width, height)
  }

  context.fillStyle = '#192e3226'
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(112, 0)
  context.lineTo(49, 36)
  context.lineTo(0, 48)
  context.fill()
  context.beginPath()
  context.moveTo(162, 16)
  context.lineTo(221, 16)
  context.lineTo(363, 77)
  context.lineTo(363, 128)
  context.lineTo(162, 52)
  context.fill()

  // Faint horizontal seams are part of the dark, layered background.
  context.fillStyle = '#0f14201f'
  for (const y of [58, 132, 226, 233]) context.fillRect(0, y, WIDTH, 1)
}

export default function SignalRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const backdrop = document.createElement('canvas')
    const backdropContext = backdrop.getContext('2d')
    if (!backdropContext) return

    const particles = createParticles()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let pixelRatio = 1
    let scale = 1
    let sceneHeight = HEIGHT
    let offsetX = 0
    let bottomShade: CanvasGradient
    let animationFrame = 0
    let lastFrame = -FRAME_MS
    let startTime = 0

    const draw = (elapsed: number) => {
      if (canvas.width === 0 || canvas.height === 0) return
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(backdrop, 0, 0)

      context.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, offsetX * pixelRatio, 0)
      context.textAlign = 'left'
      context.textBaseline = 'alphabetic'

      // Keep native edges: the reference's 1px transitions do not establish optical blur.
      for (const particle of particles) {
        context.fillStyle = particle.color
        const firstY = ((particle.y + (elapsed / 1000) * particle.speed + 40) % 420) - 40
        for (let y = firstY; y < sceneHeight + particle.size; y += 420) {
          const fade = Math.max(0, 1 - (Math.max(0, y) / sceneHeight) ** 1.3)
          context.globalAlpha = particle.opacity * fade
          if (particle.glyph) {
            context.font = `${particle.size}px Georgia, serif`
            context.fillText(
              particle.glyph,
              particle.x,
              y,
              particle.size * (particle.glyph === '404' ? 1.3 : 0.45),
            )
          } else {
            context.fillRect(particle.x, y, particle.size, particle.size * 1.12)
          }
        }
      }
      context.globalAlpha = 1
      context.fillStyle = bottomShade
      context.fillRect(0, 0, WIDTH, sceneHeight)
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      backdrop.width = canvas.width
      backdrop.height = canvas.height
      // Extend the scene vertically on phones; keep the small glyphs in proportion.
      scale = width <= 600 ? 1 : Math.max(width / WIDTH, height / HEIGHT)
      sceneHeight = Math.max(HEIGHT, height / scale)
      offsetX = (width - WIDTH * scale) * (width <= 600 ? 0.76 : 0.5)
      backdropContext.setTransform(
        scale * pixelRatio,
        0,
        0,
        scale * pixelRatio,
        offsetX * pixelRatio,
        0,
      )
      paintBackdrop(backdropContext, sceneHeight)
      // The reference's lower background converges to a flat #141824.
      bottomShade = context.createLinearGradient(0, 0, 0, sceneHeight)
      bottomShade.addColorStop(0, '#14182400')
      bottomShade.addColorStop(0.45, '#14182400')
      bottomShade.addColorStop(0.72, '#14182422')
      bottomShade.addColorStop(1, '#141824cc')
      draw(reducedMotion.matches ? 0 : Math.max(0, lastFrame))
    }

    const tick = (now: number) => {
      const elapsed = now - startTime
      // Keep time continuous; each particle wraps independently in draw().
      const frame = Math.floor(elapsed / FRAME_MS) * FRAME_MS
      if (frame !== lastFrame) {
        lastFrame = frame
        draw(frame)
      }
      animationFrame = requestAnimationFrame(tick)
    }

    const syncPlayback = () => {
      cancelAnimationFrame(animationFrame)
      if (document.hidden || reducedMotion.matches) {
        if (reducedMotion.matches) draw(0)
        return
      }
      startTime = performance.now() - Math.max(0, lastFrame)
      animationFrame = requestAnimationFrame(tick)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    reducedMotion.addEventListener('change', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    resize()
    syncPlayback()
    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      reducedMotion.removeEventListener('change', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
