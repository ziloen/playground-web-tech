import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { cdp } from 'vitest/browser'
import RadialMenuPage from './radial-menu'

describe('RadialMenuPage', () => {
  it('uses the full angular sector as the hit target', async () => {
    const screen = await render(<RadialMenuPage />)

    const countButton = screen.getByRole('button', { name: '08', exact: true }).element()
    if (!(countButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    countButton.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('8 项径向菜单').element()
    const firstItem = screen.getByRole('button', { name: /脉冲信标，余量 03/ }).element()
    const stageBounds = stage.getBoundingClientRect()
    const itemBounds = firstItem.getBoundingClientRect()
    const center = {
      x: stageBounds.left + stageBounds.width / 2,
      y: stageBounds.top + stageBounds.height / 2,
    }
    const itemRadius = center.y - (itemBounds.top + itemBounds.height / 2)

    for (const degrees of [-18, 0, 18]) {
      const radians = (degrees / 180) * Math.PI
      const target = document.elementFromPoint(
        center.x + Math.sin(radians) * itemRadius,
        center.y - Math.cos(radians) * itemRadius,
      )

      expect(target?.closest('button')).toBe(firstItem)
    }
  })

  it('anchors the pointer indicator to the center and current pointer angle', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()
    const stageBounds = stage.getBoundingClientRect()
    const center = {
      x: stageBounds.left + stageBounds.width / 2,
      y: stageBounds.top + stageBounds.height / 2,
    }
    const pointer = {
      x: center.x + stageBounds.width * 0.32,
      y: center.y,
    }

    movePointer(pointer)
    await nextFrame()
    await nextFrame()

    const indicator = stage.querySelector('[data-pointer-indicator]')
    expect(indicator).toBeInstanceOf(HTMLElement)
    const indicatorBounds = (indicator as HTMLElement).getBoundingClientRect()

    expect(Math.abs(indicatorBounds.left - center.x)).toBeLessThan(2)
    expect(Math.abs(indicatorBounds.right - pointer.x)).toBeLessThan(2)
    expect(Math.abs((indicatorBounds.top + indicatorBounds.bottom) / 2 - center.y)).toBeLessThan(2)
  })

  it.each([
    { count: '08', itemCount: 8 },
    { count: '10', itemCount: 10 },
  ])(
    'continues tracking angle inside the $count-item center safe zone',
    async ({ count, itemCount }) => {
      const screen = await render(<RadialMenuPage />)
      const countButton = screen.getByRole('button', { name: count, exact: true }).element()
      if (!(countButton instanceof HTMLButtonElement)) {
        throw new TypeError('Expected the item count control to be a button')
      }
      countButton.click()
      await nextFrame()
      await nextFrame()

      const stage = screen.getByLabelText(`${itemCount} 项径向菜单`).element()
      const stageBounds = stage.getBoundingClientRect()
      const center = {
        x: stageBounds.left + stageBounds.width / 2,
        y: stageBounds.top + stageBounds.height / 2,
      }
      const shortDistance = stageBounds.width * 0.05

      movePointer({ x: center.x + shortDistance, y: center.y })
      await nextFrame()
      await nextFrame()

      expect(stage.dataset.focus).toBe('dead')
      expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('—')
      expect(readAngle()).toBeCloseTo(Math.PI / 2, 1)

      const indicator = stage.querySelector('[data-pointer-indicator]')
      if (!(indicator instanceof HTMLElement)) {
        throw new TypeError('Expected a pointer indicator')
      }
      expect(
        Math.abs(indicator.getBoundingClientRect().right - (center.x + shortDistance)),
      ).toBeLessThan(2)

      movePointer({ x: center.x, y: center.y + shortDistance })
      await nextFrame()
      await nextFrame()

      expect(stage.dataset.focus).toBe('dead')
      expect(readAngle()).toBeCloseTo(Math.PI, 1)
    },
  )

  it('switches the center information discretely when the nearest focus changes', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()
    const bounds = stage.getBoundingClientRect()
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    }
    const radius = bounds.width * 0.34

    const moveToSlotPosition = async (position: number) => {
      const angle = position * (Math.PI / 4)
      movePointer({
        x: center.x + Math.sin(angle) * radius,
        y: center.y - Math.cos(angle) * radius,
      })
      await nextFrame()
      await nextFrame()
    }
    const visibleCenterLabels = () =>
      Array.from(stage.querySelectorAll<HTMLElement>('strong'))
        .filter((label) => {
          const container = label.parentElement
          return (
            label.textContent &&
            container &&
            Number.parseFloat(getComputedStyle(container).opacity) > 0.01
          )
        })
        .map((label) => label.textContent)

    await moveToSlotPosition(0.49)
    expect(visibleCenterLabels()).toEqual(['脉冲信标'])

    await moveToSlotPosition(0.51)
    expect(visibleCenterLabels()).toEqual(['折光帷幕'])
  })

  it('tilts only finite rings toward the pointer within four degrees', async () => {
    const screen = await render(<RadialMenuPage />)
    const eightItems = screen.getByRole('button', { name: '08', exact: true }).element()
    if (!(eightItems instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    eightItems.click()
    await nextFrame()
    await nextFrame()

    let stage = screen.getByLabelText('8 项径向菜单').element()
    let tiltPlane = stage.querySelector<HTMLElement>('[data-tilt-plane]')
    expect(tiltPlane).not.toBeNull()

    let bounds = stage.getBoundingClientRect()
    movePointer({
      x: bounds.left + bounds.width * 0.95,
      y: bounds.top + bounds.height / 2,
    })
    await nextFrame()
    await nextFrame()

    const rightMatrix = new DOMMatrix(getComputedStyle(tiltPlane!).transform)
    const rightTilt = Math.atan2(rightMatrix.m13, rightMatrix.m11) * (180 / Math.PI)

    movePointer({
      x: bounds.left + bounds.width * 0.05,
      y: bounds.top + bounds.height / 2,
    })
    await nextFrame()
    await nextFrame()

    const leftMatrix = new DOMMatrix(getComputedStyle(tiltPlane!).transform)
    const leftTilt = Math.atan2(leftMatrix.m13, leftMatrix.m11) * (180 / Math.PI)

    expect(Math.sign(rightTilt)).toBe(-Math.sign(leftTilt))
    expect(Math.abs(rightTilt)).toBeGreaterThan(3)
    expect(Math.abs(rightTilt)).toBeLessThanOrEqual(4.05)
    expect(Math.abs(leftTilt)).toBeGreaterThan(3)
    expect(Math.abs(leftTilt)).toBeLessThanOrEqual(4.05)

    dispatchKey('keydown', 'Escape')
    await nextFrame()
    await nextFrame()
    const resetMatrix = new DOMMatrix(getComputedStyle(tiltPlane!).transform)
    const resetTilt = Math.atan2(resetMatrix.m13, resetMatrix.m11) * (180 / Math.PI)
    expect(Math.abs(resetTilt)).toBeLessThan(0.01)

    const tenItems = screen.getByRole('button', { name: '10', exact: true }).element()
    if (!(tenItems instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    tenItems.click()
    await nextFrame()
    await nextFrame()

    stage = screen.getByLabelText('10 项径向菜单').element()
    tiltPlane = stage.querySelector<HTMLElement>('[data-tilt-plane]')
    bounds = stage.getBoundingClientRect()
    movePointer({
      x: bounds.left + bounds.width * 0.95,
      y: bounds.top + bounds.height / 2,
    })
    await nextFrame()
    await nextFrame()

    expect(getComputedStyle(tiltPlane!).transform).toBe('none')
  })

  it('pads the unfinished spiral lap before starting a visibly divided new cycle', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()

    await traceClockwise(stage, 0, 1)
    expect(readAngle()).toBeCloseTo(Math.PI * 2, 1)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('09')

    await traceClockwise(stage, 1, 1.25)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('—')
    expect(stage.dataset.focus).toBe('blank')

    await traceClockwise(stage, 1.25, 2)
    expect(readAngle()).toBeCloseTo(Math.PI * 4, 1)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('01')

    const divider = stage.querySelector<HTMLElement>('[data-cycle-divider]')
    expect(divider).not.toBeNull()
    expect(Number.parseFloat(getComputedStyle(divider!).opacity)).toBeGreaterThan(0.9)
  })

  it('renders padded blank slots as distinct non-interactive sectors', async () => {
    const screen = await render(<RadialMenuPage />)
    let stage = screen.getByLabelText('10 项径向菜单').element()
    let blankSectors = stage.querySelectorAll<HTMLElement>('[data-empty-slot]')

    expect(blankSectors).toHaveLength(6)
    expect(
      Array.from(blankSectors).every((sector) => sector.getAttribute('aria-hidden') === 'true'),
    ).toBe(true)
    expect(
      Math.max(
        ...Array.from(blankSectors, (sector) =>
          Number.parseFloat(getComputedStyle(sector).opacity),
        ),
      ),
    ).toBeLessThan(0.3)

    await traceClockwise(stage, 0, 1.25)
    const focusedBlank = stage.querySelector<HTMLElement>('[data-empty-slot="10"]')
    const contentSector = stage.querySelector<HTMLElement>('[data-index="0"]')
    expect(focusedBlank).not.toBeNull()
    expect(focusedBlank?.dataset.direction).toBe('current')
    const focusedBlankOpacity = Number.parseFloat(getComputedStyle(focusedBlank!).opacity)
    expect(focusedBlankOpacity).toBeGreaterThan(0.3)
    expect(focusedBlankOpacity).toBeLessThanOrEqual(0.38)
    expect(getComputedStyle(focusedBlank!).pointerEvents).toBe('none')
    expect(getComputedStyle(focusedBlank!, '::before').backgroundImage).not.toBe(
      getComputedStyle(contentSector!, '::before').backgroundImage,
    )

    const immediateLoop = screen.getByRole('button', { name: '紧接末项', exact: true }).element()
    if (!(immediateLoop instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the loop strategy control to be a button')
    }
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    stage = screen.getByLabelText('10 项径向菜单').element()
    blankSectors = stage.querySelectorAll<HTMLElement>('[data-empty-slot]')
    expect(blankSectors).toHaveLength(0)
  })

  it.each([
    { loopMode: '补满整圈', controlName: null, sectorCount: 16 },
    { loopMode: '紧接末项', controlName: '紧接末项', sectorCount: 10 },
  ])(
    'keeps at most eight sectors fully opaque across repeated turns in $loopMode mode',
    async ({ controlName, sectorCount }) => {
      const screen = await render(<RadialMenuPage />)

      if (controlName) {
        const loopControl = screen.getByRole('button', { name: controlName, exact: true }).element()
        if (!(loopControl instanceof HTMLButtonElement)) {
          throw new TypeError('Expected the loop strategy control to be a button')
        }
        loopControl.click()
        await nextFrame()
        await nextFrame()
      }

      const stage = screen.getByLabelText('10 项径向菜单').element()
      const sectors = stage.querySelectorAll<HTMLElement>('[data-index], [data-empty-slot]')
      expect(sectors).toHaveLength(sectorCount)

      let fromTurns = 0
      let highestOpaqueCount = 0

      for (let step = 1; step <= 16; step += 1) {
        const toTurns = step / 8
        // Each segment must extend the same pointer trajectory to exercise angle unwrapping.
        // eslint-disable-next-line no-await-in-loop
        await traceClockwise(stage, fromTurns, toTurns)

        const opaqueCount = Array.from(sectors).filter(
          (sector) => Number.parseFloat(getComputedStyle(sector).opacity) >= 0.999,
        ).length
        highestOpaqueCount = Math.max(highestOpaqueCount, opaqueCount)
        expect(opaqueCount).toBeLessThanOrEqual(8)
        fromTurns = toTurns
      }

      expect(highestOpaqueCount).toBe(8)
    },
  )

  it('can start the next spiral cycle immediately after the final item', async () => {
    const screen = await render(<RadialMenuPage />)
    const immediateLoop = screen.getByRole('button', { name: '紧接末项', exact: true }).element()
    if (!(immediateLoop instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the loop strategy control to be a button')
    }
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('10 项径向菜单').element()

    await traceClockwise(stage, 0, 1)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('09')

    await traceClockwise(stage, 1, 1.125)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('10')

    await traceClockwise(stage, 1.125, 1.25)
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('01')
    expect(stage.dataset.focus).toBe('item')

    const divider = stage.querySelector<HTMLElement>('[data-cycle-divider]')
    expect(Number.parseFloat(getComputedStyle(divider!).opacity)).toBeGreaterThan(0.9)
  })

  it('uses a restrained six-percent scale step around the focused spiral item', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()
    const bounds = stage.getBoundingClientRect()
    const angle = (Math.PI * 2 * 3) / 8
    const radius = bounds.width * 0.34

    movePointer({
      x: bounds.left + bounds.width / 2 + Math.sin(angle) * radius,
      y: bounds.top + bounds.height / 2 - Math.cos(angle) * radius,
    })
    await nextFrame()
    await nextFrame()

    const before = readVisualScale(stage, 2)
    const current = readVisualScale(stage, 3)
    const after = readVisualScale(stage, 4)
    const beforeDistance = readRadialDistance(stage, 2)
    const currentDistance = readRadialDistance(stage, 3)
    const afterDistance = readRadialDistance(stage, 4)

    expect(before / current).toBeCloseTo(1.06, 2)
    expect(after / current).toBeCloseTo(0.94, 2)
    expect(beforeDistance / currentDistance).toBeCloseTo(1.06, 2)
    expect(afterDistance / currentDistance).toBeCloseTo(0.94, 2)
  })

  it('configures forward expansion and trailing convergence independently', async () => {
    const screen = await render(<RadialMenuPage />)
    const enlargement = screen.getByRole('slider', { name: '前向展开强度' }).element()
    const reduction = screen.getByRole('slider', { name: '后向收束强度' }).element()
    if (!(enlargement instanceof HTMLInputElement) || !(reduction instanceof HTMLInputElement)) {
      throw new TypeError('Expected two spiral depth controls')
    }

    expect(screen.getByLabelText('螺旋层级强度')).toBeVisible()
    expect(screen.getByText('放大 · 外移')).toBeVisible()
    expect(screen.getByText('缩小 · 内移')).toBeVisible()
    expect(enlargement.value).toBe('6')
    expect(reduction.value).toBe('6')
    setRangeValue(enlargement, 10)
    setRangeValue(reduction, 3)
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('10 项径向菜单').element()
    const bounds = stage.getBoundingClientRect()
    const angle = (Math.PI * 2 * 3) / 8
    const radius = bounds.width * 0.34
    movePointer({
      x: bounds.left + bounds.width / 2 + Math.sin(angle) * radius,
      y: bounds.top + bounds.height / 2 - Math.cos(angle) * radius,
    })
    await nextFrame()
    await nextFrame()

    const before = readVisualScale(stage, 2)
    const current = readVisualScale(stage, 3)
    const after = readVisualScale(stage, 4)
    const beforeDistance = readRadialDistance(stage, 2)
    const currentDistance = readRadialDistance(stage, 3)
    const afterDistance = readRadialDistance(stage, 4)

    expect(before / current).toBeCloseTo(1.1, 2)
    expect(after / current).toBeCloseTo(0.97, 2)
    expect(beforeDistance / currentDistance).toBeCloseTo(1.1, 2)
    expect(afterDistance / currentDistance).toBeCloseTo(0.97, 2)
    expect(screen.getByText('+10% / 槽')).toBeVisible()
    expect(screen.getByText('−3% / 槽')).toBeVisible()
  })

  it.each([
    { count: '06', itemCount: 6, mode: 'ring', label: '等分圆环' },
    { count: '08', itemCount: 8, mode: 'ring', label: '等分圆环' },
    { count: '10', itemCount: 10, mode: 'spiral', label: '连续螺旋' },
    { count: '14', itemCount: 14, mode: 'spiral', label: '连续螺旋' },
  ])('uses $label for $count items', async ({ count, itemCount, mode, label }) => {
    const screen = await render(<RadialMenuPage />)
    const countButton = screen.getByRole('button', { name: count, exact: true }).element()
    if (!(countButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    countButton.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText(`${itemCount} 项径向菜单`).element()
    const modeReadout = screen.getByText('轨道模式').element().nextElementSibling

    expect(stage.dataset.mode).toBe(mode)
    expect(stage.querySelectorAll('[data-index]')).toHaveLength(itemCount)
    expect(modeReadout).toHaveTextContent(label)
  })

  it('starts a ten-item spiral with seven and eight fading while nine and ten stay hidden', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()
    await nextFrame()
    await nextFrame()

    const opacity = (index: number) => {
      const item = stage.querySelector<HTMLElement>(`[data-index="${index}"]`)
      if (!item) throw new TypeError(`Expected menu item ${index + 1}`)
      return {
        value: Number.parseFloat(getComputedStyle(item).opacity),
        pointerEvents: getComputedStyle(item).pointerEvents,
      }
    }

    const seven = opacity(6)
    const eight = opacity(7)
    const nine = opacity(8)
    const ten = opacity(9)

    expect(seven.value).toBeGreaterThan(eight.value)
    expect(seven.value).toBeLessThan(1)
    expect(eight.value).toBeGreaterThan(0)
    expect(nine.value).toBeLessThan(0.02)
    expect(ten.value).toBe(0)
    expect(nine.pointerEvents).toBe('none')
    expect(ten.pointerEvents).toBe('none')
  })

  it('confirms on Q release only outside the safe zone and lets Escape cancel', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()
    const bounds = stage.getBoundingClientRect()
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    }
    const lastSelection = screen.getByText('最近确认').element().nextElementSibling

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x, y: center.y - bounds.height * 0.34 })
    await nextFrame()
    await nextFrame()
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(lastSelection).toHaveTextContent('脉冲信标')

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x + bounds.width * 0.04, y: center.y })
    await nextFrame()
    await nextFrame()
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(stage.dataset.focus).toBe('dead')
    expect(lastSelection).toHaveTextContent('脉冲信标')

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x + bounds.width * 0.34, y: center.y })
    await nextFrame()
    await nextFrame()
    dispatchKey('keydown', 'Escape')
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(stage.dataset.phase).toBe('cancelled')
    expect(stage.dataset.focus).toBe('dead')
    expect(lastSelection).toHaveTextContent('脉冲信标')
  })

  it('supports arrow-key selection followed by Enter confirmation', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10 项径向菜单').element()

    dispatchKey('keydown', 'ArrowRight')
    await nextFrame()
    await nextFrame()

    expect(stage.dataset.focus).toBe('item')
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('02')

    dispatchKey('keydown', 'Enter')
    await nextFrame()

    expect(screen.getByText('最近确认').element().nextElementSibling).toHaveTextContent('折光帷幕')
  })

  it('switches light-dark tokens through the page color scheme', async () => {
    const screen = await render(<RadialMenuPage />)
    const page = document.querySelector('main')
    if (!(page instanceof HTMLElement)) throw new TypeError('Expected the radial menu page')

    const darkBackground = getComputedStyle(page).backgroundColor
    expect(getComputedStyle(page).colorScheme).toBe('dark')

    const lightButton = screen.getByRole('button', { name: '亮色', exact: true }).element()
    if (!(lightButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the light theme control to be a button')
    }
    lightButton.click()
    await nextFrame()
    const lightBackground = getComputedStyle(page).backgroundColor
    expect(getComputedStyle(page).colorScheme).toBe('light')
    expect(lightBackground).not.toBe(darkBackground)

    const autoButton = screen.getByRole('button', { name: '自动', exact: true }).element()
    if (!(autoButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the automatic theme control to be a button')
    }
    autoButton.click()
    await nextFrame()
    expect(getComputedStyle(page).colorScheme).toBe('light dark')
    expect(screen.getByRole('button', { name: '自动', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('removes pointer-driven tilt when reduced motion is requested', async () => {
    const screen = await render(<RadialMenuPage />)
    const eightItems = screen.getByRole('button', { name: '08', exact: true }).element()
    if (!(eightItems instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    eightItems.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('8 项径向菜单').element()
    const tiltPlane = stage.querySelector<HTMLElement>('[data-tilt-plane]')
    if (!tiltPlane) throw new TypeError('Expected a tilt plane')
    const bounds = stage.getBoundingClientRect()

    movePointer({
      x: bounds.left + bounds.width * 0.95,
      y: bounds.top + bounds.height / 2,
    })
    await nextFrame()
    await nextFrame()
    expect(getComputedStyle(tiltPlane).transform).not.toBe('none')

    try {
      await setReducedMotion('reduce')
      await nextFrame()
      await nextFrame()

      expect(getComputedStyle(tiltPlane).transform).toBe('none')
    } finally {
      await setReducedMotion('no-preference')
    }
  })
})

function movePointer({ x, y }: { x: number; y: number }) {
  window.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX: x,
      clientY: y,
      bubbles: true,
    }),
  )
}

function dispatchKey(type: 'keydown' | 'keyup', key: string) {
  document.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }))
}

function setRangeValue(input: HTMLInputElement, value: number) {
  const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  if (!valueDescriptor?.set) throw new TypeError('Expected the native input value setter')
  const setValue = valueDescriptor.set.bind(input)
  setValue(String(value))
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function readAngle() {
  const value = document.querySelector('[data-angle-readout]')?.textContent
  if (!value) throw new TypeError('Expected an angle readout')
  return Number.parseFloat(value)
}

function readVisualScale(stage: Element, index: number) {
  const item = stage.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!item) throw new TypeError(`Expected menu item ${index + 1}`)
  const matrix = new DOMMatrix(getComputedStyle(item).transform)
  return Math.hypot(matrix.m21, matrix.m22)
}

function readRadialDistance(stage: Element, index: number) {
  const item = stage.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!item) throw new TypeError(`Expected menu item ${index + 1}`)
  const stageBounds = stage.getBoundingClientRect()
  const itemBounds = item.getBoundingClientRect()
  return Math.hypot(
    itemBounds.left + itemBounds.width / 2 - (stageBounds.left + stageBounds.width / 2),
    itemBounds.top + itemBounds.height / 2 - (stageBounds.top + stageBounds.height / 2),
  )
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

async function traceClockwise(stage: Element, fromTurns: number, toTurns: number) {
  const bounds = stage.getBoundingClientRect()
  const center = {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  }
  const radius = bounds.width * 0.38
  const steps = Math.ceil((toTurns - fromTurns) * 32)

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps
    const angle = (fromTurns + (toTurns - fromTurns) * progress) * Math.PI * 2
    movePointer({
      x: center.x + Math.sin(angle) * radius,
      y: center.y - Math.cos(angle) * radius,
    })
  }

  await nextFrame()
  await nextFrame()
}

function setReducedMotion(value: 'reduce' | 'no-preference') {
  const session = cdp() as unknown as {
    send(method: string, parameters: object): Promise<object>
  }
  return session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  })
}
