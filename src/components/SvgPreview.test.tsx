import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import SvgPreview from './SvgPreview'

const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>')}`

function Scene({ src = source }: { src?: string }) {
  return (
    <div style={{ width: 800, height: 600, display: 'flex' }}>
      <SvgPreview src={src} width={200} height={100} />
    </div>
  )
}

async function nextPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function getPreview() {
  const viewport = document.querySelector<HTMLElement>('[data-panzoom-viewport]')!
  const content = document.querySelector<HTMLElement>('[data-panzoom-content]')!
  const image = viewport.querySelector('iframe')!
  return { viewport, content, image }
}

describe('SvgPreview', () => {
  it('keeps the SVG point under the cursor fixed through repeated wheel zooms', async () => {
    await render(<Scene />)
    await nextPaint()
    const { viewport, image } = getPreview()
    const before = image.getBoundingClientRect()
    const clientX = before.left + before.width * 0.25
    const clientY = before.top + before.height * 0.25

    for (let index = 0; index < 8; index++) {
      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -24,
        clientX,
        clientY,
      })
      viewport.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      // eslint-disable-next-line no-await-in-loop -- Exercise separate frames to catch focal point drift.
      await nextPaint()
    }

    const after = image.getBoundingClientRect()
    expect(after.width).toBeGreaterThan(before.width * 2)
    expect(after.left + after.width * 0.25).toBeCloseTo(clientX, 0)
    expect(after.top + after.height * 0.25).toBeCloseTo(clientY, 0)
    expect(image.src).toBe(source)
  })

  it('bounds zoom, resets it and starts new SVG imports at their original size', async () => {
    const screen = await render(<Scene />)
    await nextPaint()
    const { image } = getPreview()
    const initialWidth = image.getBoundingClientRect().width
    const zoomIn = screen.getByRole('button', { name: 'Zoom in', exact: true }).element()
    if (!(zoomIn instanceof HTMLButtonElement)) throw new TypeError('Expected a zoom button')
    for (let index = 0; index < 12; index++) {
      zoomIn.click()
    }
    await nextPaint()
    expect(image.getBoundingClientRect().width).toBeCloseTo(initialWidth * 10, 0)
    await screen.getByRole('button', { name: 'Reset view' }).click()
    await nextPaint()
    expect(image.getBoundingClientRect().width).toBeCloseTo(initialWidth, 0)
    await screen.getByRole('button', { name: 'Zoom out', exact: true }).click()
    await nextPaint()
    expect(image.getBoundingClientRect().width).toBeCloseTo(initialWidth, 0)
    await screen.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await nextPaint()
    await screen.rerender(<Scene src={source.replace('red', 'blue')} />)
    await nextPaint()
    expect(image.getBoundingClientRect().width).toBeCloseTo(initialWidth, 0)
  })

  it('pans at the pointer speed after zooming and stops on pointer cancellation', async () => {
    const screen = await render(<Scene />)
    await screen.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await nextPaint()
    const { viewport, image } = getPreview()
    const before = image.getBoundingClientRect()
    const pointer = {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 400,
      clientY: 300,
    }
    viewport.dispatchEvent(new PointerEvent('pointerdown', pointer))
    document.dispatchEvent(
      new PointerEvent('pointermove', { ...pointer, clientX: 450, clientY: 330 }),
    )
    await nextPaint()
    const after = image.getBoundingClientRect()
    expect(after.left - before.left).toBeCloseTo(50, 0)
    expect(after.top - before.top).toBeCloseTo(30, 0)
    document.dispatchEvent(new PointerEvent('pointercancel', pointer))
    document.dispatchEvent(
      new PointerEvent('pointermove', { ...pointer, clientX: 600, clientY: 500 }),
    )
    await nextPaint()
    expect(image.getBoundingClientRect().left).toBeCloseTo(after.left, 0)
  })
})
