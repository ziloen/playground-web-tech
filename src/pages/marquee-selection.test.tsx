import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import MarqueeSelection from './marquee-selection'

describe('MarqueeSelection', () => {
  it('keeps the start empty, preserves the native selection, and does not focus a label', async () => {
    const screen = await render(<MarqueeSelection />)
    const selection = document.getSelection()!

    try {
      const labelCopy = screen
        .getByText('Firefox 使用多个原生 Range 保留矩形中的离散文字。')
        .element()
      if (!(labelCopy instanceof HTMLElement)) throw new TypeError('Expected an HTML element')

      const label = labelCopy.closest('label')!
      const input = label.querySelector('input')!

      label.scrollIntoView({ block: 'center' })
      await nextFrame()

      const start = firstGraphemeCenter(labelCopy)
      movePointer(start)
      pressShortcut()
      await nextFrame()

      expect(selection.rangeCount).toBe(0)
      expect(screen.getByTestId('marquee-overlay').element().dataset.active).toBe('true')

      const copyBounds = labelCopy.getBoundingClientRect()
      movePointer({ x: copyBounds.right - 1, y: copyBounds.bottom - 1 })
      await nextFrame()

      expect(selection.toString()).toContain('Firefox')

      expect(
        label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true })),
      ).toBe(false)
      expect(
        label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
      ).toBe(false)
      await nextFrame()

      expect(screen.getByTestId('event-mouseup').element().textContent).toBe('0')
      expect(screen.getByTestId('event-click').element().textContent).toBe('0')
      expect(screen.getByTestId('focused-control').element().textContent).toBe('无')
      expect(document.activeElement).not.toBe(input)

      releaseShortcut()
      const completedText = selection.toString()

      expect(completedText).toContain('Firefox')
      expect(screen.getByTestId('marquee-overlay').element().dataset.active).toBe('false')
      expect(screen.getByTestId('marquee-status').element().dataset.phase).toBe('complete')

      movePointer(start)
      pressShortcut()
      movePointer({ x: copyBounds.right - 1, y: copyBounds.bottom - 1 })
      await nextFrame()
      expect(selection.rangeCount).toBeGreaterThan(0)

      dispatchKey('keydown', 'Escape', { ctrlKey: true, altKey: true })
      releaseShortcut()

      expect(selection.rangeCount).toBe(0)
      expect(screen.getByTestId('marquee-overlay').element().dataset.active).toBe('false')
      expect(screen.getByTestId('marquee-status').element().dataset.phase).toBe('cancelled')
    } finally {
      selection.removeAllRanges()
    }
  })
})

function firstGraphemeCenter(element: HTMLElement) {
  const textNode = element.firstChild
  if (!(textNode instanceof Text)) throw new TypeError('Expected a text node')

  const range = document.createRange()
  range.setStart(textNode, 0)
  range.setEnd(textNode, 1)
  const bounds = range.getBoundingClientRect()

  return {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  }
}

function movePointer({ x, y }: { x: number; y: number }) {
  window.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX: x,
      clientY: y,
      bubbles: true,
    }),
  )
}

function pressShortcut() {
  dispatchKey('keydown', 'Control', { ctrlKey: true })
  dispatchKey('keydown', 'Alt', { ctrlKey: true, altKey: true })
}

function releaseShortcut() {
  dispatchKey('keyup', 'Alt', { ctrlKey: true })
  dispatchKey('keyup', 'Control')
}

function dispatchKey(
  type: 'keydown' | 'keyup',
  key: string,
  modifiers: Pick<KeyboardEventInit, 'ctrlKey' | 'altKey'> = {},
) {
  document.dispatchEvent(
    new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    }),
  )
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}
