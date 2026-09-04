import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { cdp, userEvent } from 'vitest/browser'
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

    const stage = screen.getByLabelText('8-item radial menu').element()
    const firstItem = screen.getByRole('button', { name: /Pulse Beacon, 03 remaining/ }).element()
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

  it('keeps spiral sectors on fixed spokes while the pointer moves clockwise', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    }
    const radius = bounds.width * 0.36

    movePointer({ x: center.x, y: center.y - radius })
    await nextFrame()
    await nextFrame()
    const before = readSectorAngle(stage, 2)

    movePointer({ x: center.x + radius, y: center.y })
    await nextFrame()
    await nextFrame()
    const after = readSectorAngle(stage, 2)

    expect(before).toBeCloseTo(Math.PI / 2, 4)
    expect(after).toBeCloseTo(Math.PI / 2, 4)
  })

  it('builds every finite-ring sector from the same 25/43-percent radii', async () => {
    const screen = await render(<RadialMenuPage />)
    const countButton = screen.getByRole('button', { name: '08', exact: true }).element()
    if (!(countButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    countButton.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('8-item radial menu').element()
    const stageBounds = stage.getBoundingClientRect()
    const sectors = Array.from(stage.querySelectorAll<HTMLElement>('[data-index]'))
    const radialDistances = sectors.map((sector) => {
      const style = getComputedStyle(sector)
      expect(Number.parseFloat(style.getPropertyValue('--sector-inner-radius'))).toBeCloseTo(
        stageBounds.width * 0.25,
        1,
      )
      expect(Number.parseFloat(style.getPropertyValue('--sector-outer-radius'))).toBeCloseTo(
        stageBounds.width * 0.43,
        1,
      )
      expect(style.clipPath).toContain(' A ')

      const bounds = sector.getBoundingClientRect()
      return Math.hypot(
        bounds.left + bounds.width / 2 - (stageBounds.left + stageBounds.width / 2),
        bounds.top + bounds.height / 2 - (stageBounds.top + stageBounds.height / 2),
      )
    })

    expect(Math.max(...radialDistances) - Math.min(...radialDistances)).toBeLessThan(0.5)

    const center = {
      x: stageBounds.left + stageBounds.width / 2,
      y: stageBounds.top + stageBounds.height / 2,
    }
    const hitAtRadius = (ratio: number) =>
      document.elementFromPoint(center.x, center.y - stageBounds.width * ratio)?.closest('button')

    expect(hitAtRadius(0.24)).not.toBe(sectors[0])
    expect(hitAtRadius(0.26)).toBe(sectors[0])
    expect(hitAtRadius(0.42)).toBe(sectors[0])
    expect(hitAtRadius(0.44)).not.toBe(sectors[0])
  })

  it('anchors the pointer indicator to the center and current pointer angle', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
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

      const stage = screen.getByLabelText(`${itemCount}-item radial menu`).element()
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
    const stage = screen.getByLabelText('10-item radial menu').element()
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
    expect(visibleCenterLabels()).toEqual(['Pulse Beacon'])

    await moveToSlotPosition(0.51)
    expect(visibleCenterLabels()).toEqual(['Refraction Veil'])
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

    let stage = screen.getByLabelText('8-item radial menu').element()
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

    stage = screen.getByLabelText('10-item radial menu').element()
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
    const stage = screen.getByLabelText('10-item radial menu').element()

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
    let stage = screen.getByLabelText('10-item radial menu').element()
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
    ).toBeLessThanOrEqual(0.36)

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

    const immediateLoop = screen
      .getByRole('button', { name: 'Continue after last', exact: true })
      .element()
    if (!(immediateLoop instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the loop strategy control to be a button')
    }
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    stage = screen.getByLabelText('10-item radial menu').element()
    blankSectors = stage.querySelectorAll<HTMLElement>('[data-empty-slot]')
    expect(blankSectors).toHaveLength(0)
  })

  it.each([
    { loopMode: 'complete lap', controlName: null, sectorCount: 16 },
    { loopMode: 'continue after last', controlName: 'Continue after last', sectorCount: 10 },
  ])(
    'keeps at most seven sectors fully opaque across repeated turns in $loopMode mode',
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

      const stage = screen.getByLabelText('10-item radial menu').element()
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
        expect(opaqueCount).toBeLessThanOrEqual(7)
        fromTurns = toTurns
      }

      expect(highestOpaqueCount).toBe(7)
    },
  )

  it('keeps three sectors on either side opaque, then fades three more on each side', async () => {
    const screen = await render(<RadialMenuPage />)
    const fourteenItems = screen.getByRole('button', { name: '14', exact: true }).element()
    const immediateLoop = screen
      .getByRole('button', { name: 'Continue after last', exact: true })
      .element()
    if (
      !(fourteenItems instanceof HTMLButtonElement) ||
      !(immediateLoop instanceof HTMLButtonElement)
    ) {
      throw new TypeError('Expected item-count and loop controls')
    }
    fourteenItems.click()
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('14-item radial menu').element()
    const opacities = Array.from(stage.querySelectorAll<HTMLElement>('[data-index]'), (sector) =>
      Number.parseFloat(getComputedStyle(sector).opacity),
    )

    expect(opacities.filter((opacity) => opacity === 1)).toHaveLength(7)
    expect(opacities.filter((opacity) => opacity > 0 && opacity < 1)).toHaveLength(6)
    expect(opacities[4]).toBeGreaterThan(opacities[5]!)
    expect(opacities[5]).toBeGreaterThan(opacities[6]!)
    expect(opacities[8]).toBeLessThan(opacities[9]!)
    expect(opacities[9]).toBeLessThan(opacities[10]!)
    expect(opacities[7]).toBe(0)
  })

  it('can start the next spiral cycle immediately after the final item', async () => {
    const screen = await render(<RadialMenuPage />)
    const immediateLoop = screen
      .getByRole('button', { name: 'Continue after last', exact: true })
      .element()
    if (!(immediateLoop instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the loop strategy control to be a button')
    }
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('10-item radial menu').element()

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

  it('crossfades repeated items without teleporting them across an immediate-loop seam', async () => {
    const screen = await render(<RadialMenuPage />)
    const immediateLoop = screen
      .getByRole('button', { name: 'Continue after last', exact: true })
      .element()
    if (!(immediateLoop instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the loop strategy control to be a button')
    }
    immediateLoop.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('10-item radial menu').element()
    const seamPosition = 5
    await traceClockwise(stage, 0, (seamPosition - 0.01) / 8)
    const before = readVisibleItemCopies(stage, 0)
    await traceClockwise(stage, (seamPosition - 0.01) / 8, (seamPosition + 0.01) / 8)
    const after = readVisibleItemCopies(stage, 0)

    expect(before).toHaveLength(2)
    expect(after).toHaveLength(2)
    expect(before.map((copy) => copy.angle)).toEqual([
      expect.closeTo(0, 3),
      expect.closeTo(Math.PI / 2, 3),
    ])
    expect(after.map((copy) => copy.angle)).toEqual([
      expect.closeTo(0, 3),
      expect.closeTo(Math.PI / 2, 3),
    ])
    expect(Math.abs(before[0]!.opacity - after[0]!.opacity)).toBeLessThan(0.02)
    expect(Math.abs(before[1]!.opacity - after[1]!.opacity)).toBeLessThan(0.02)
  })

  it('uses a restrained six-percent scale step around the focused spiral item', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
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

  it('uses one spiral depth control for forward expansion and trailing convergence', async () => {
    const screen = await render(<RadialMenuPage />)
    const depthControl = screen.getByRole('slider', { name: 'Spiral depth' }).element()
    if (!(depthControl instanceof HTMLInputElement)) {
      throw new TypeError('Expected one spiral depth control')
    }

    expect(document.querySelectorAll('input[type="range"]')).toHaveLength(1)
    expect(screen.getByLabelText('Spiral depth control')).toBeVisible()
    expect(screen.getByText('Scale + radial offset')).toBeVisible()
    expect(depthControl.value).toBe('6')
    setRangeValue(depthControl, 10)
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('10-item radial menu').element()
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
    expect(after / current).toBeCloseTo(0.9, 2)
    expect(beforeDistance / currentDistance).toBeCloseTo(1.1, 2)
    expect(afterDistance / currentDistance).toBeCloseTo(0.9, 2)
    expect(screen.getByText('10% / slot')).toBeVisible()
  })

  it('renders the radial menu page entirely in English', async () => {
    await render(<RadialMenuPage />)
    const page = document.querySelector('main')

    expect(page).not.toBeNull()
    expect(page).toHaveAttribute('lang', 'en')
    expect(page?.textContent).not.toMatch(/\p{Script=Han}/u)
  })

  it.each([
    { count: '06', itemCount: 6, blankCount: 2, mode: 'ring', label: 'Even ring' },
    { count: '08', itemCount: 8, blankCount: 0, mode: 'ring', label: 'Even ring' },
    { count: '10', itemCount: 10, blankCount: 6, mode: 'spiral', label: 'Continuous spiral' },
    { count: '14', itemCount: 14, blankCount: 2, mode: 'spiral', label: 'Continuous spiral' },
  ])(
    'uses $label for $count items and pads it with $blankCount blank slots',
    async ({ count, itemCount, blankCount, mode, label }) => {
      const screen = await render(<RadialMenuPage />)
      const countButton = screen.getByRole('button', { name: count, exact: true }).element()
      if (!(countButton instanceof HTMLButtonElement)) {
        throw new TypeError('Expected the item count control to be a button')
      }
      countButton.click()
      await nextFrame()
      await nextFrame()

      const stage = screen.getByLabelText(`${itemCount}-item radial menu`).element()
      const modeReadout = screen.getByText('Track mode').element().nextElementSibling

      expect(stage.dataset.mode).toBe(mode)
      expect(stage.querySelectorAll('[data-index]')).toHaveLength(itemCount)
      expect(stage.querySelectorAll('[data-empty-slot]')).toHaveLength(blankCount)
      expect(modeReadout).toHaveTextContent(label)
    },
  )

  it('starts a ten-item spiral with three fading sectors before the hidden range', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
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

    const four = opacity(3)
    const five = opacity(4)
    const six = opacity(5)
    const seven = opacity(6)
    const eight = opacity(7)

    expect(four.value).toBe(1)
    expect(five.value).toBeGreaterThan(six.value)
    expect(six.value).toBeGreaterThan(seven.value)
    expect(seven.value).toBeGreaterThan(0)
    expect(eight.value).toBe(0)
    expect(eight.pointerEvents).toBe('none')
  })

  it('removes fully hidden spiral sectors from the tab order', async () => {
    const screen = await render(<RadialMenuPage />)
    const fourteenItems = screen.getByRole('button', { name: '14', exact: true }).element()
    if (!(fourteenItems instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the item count control to be a button')
    }
    fourteenItems.click()
    await nextFrame()
    await nextFrame()

    const stage = screen.getByLabelText('14-item radial menu').element()
    const primarySectors = stage.querySelectorAll<HTMLElement>('[data-cycle-copy="0"]')
    const hiddenSectors = Array.from(primarySectors).filter(
      (sector) => Number.parseFloat(getComputedStyle(sector).opacity) <= 0.16,
    )

    expect(hiddenSectors.length).toBeGreaterThan(0)
    expect(hiddenSectors.every((sector) => sector.tabIndex === -1)).toBe(true)
  })

  it('confirms on Q release only outside the safe zone and lets Escape cancel', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    }
    const lastSelection = screen.getByText('Last confirmed').element().nextElementSibling

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x, y: center.y - bounds.height * 0.34 })
    await nextFrame()
    await nextFrame()
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(lastSelection).toHaveTextContent('Pulse Beacon')

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x + bounds.width * 0.04, y: center.y })
    await nextFrame()
    await nextFrame()
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(stage.dataset.focus).toBe('dead')
    expect(lastSelection).toHaveTextContent('Pulse Beacon')

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x + bounds.width * 0.34, y: center.y })
    await nextFrame()
    await nextFrame()
    dispatchKey('keydown', 'Escape')
    dispatchKey('keyup', 'q')
    await nextFrame()
    expect(stage.dataset.phase).toBe('cancelled')
    expect(stage.dataset.focus).toBe('dead')
    expect(lastSelection).toHaveTextContent('Pulse Beacon')
  })

  it('cancels an interrupted touch gesture without confirming it', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()
    let capturedPointerId: number | null = null

    stage.setPointerCapture = (pointerId) => {
      capturedPointerId = pointerId
    }
    stage.hasPointerCapture = (pointerId) => capturedPointerId === pointerId
    stage.releasePointerCapture = (pointerId) => {
      if (capturedPointerId === pointerId) capturedPointerId = null
    }

    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 7,
        pointerType: 'touch',
        clientX: bounds.left + bounds.width / 2,
        clientY: bounds.top + bounds.height * 0.16,
        bubbles: true,
        cancelable: true,
      }),
    )
    await nextFrame()
    await nextFrame()
    expect(stage.dataset.focus).toBe('item')

    stage.dispatchEvent(
      new PointerEvent('pointercancel', {
        pointerId: 7,
        pointerType: 'touch',
        bubbles: true,
        cancelable: true,
      }),
    )
    await nextFrame()

    expect(capturedPointerId).toBeNull()
    expect(stage.dataset.phase).toBe('cancelled')
    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'No selection',
    )
  })

  it('supports arrow-key selection followed by Enter confirmation', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()

    dispatchKey('keydown', 'ArrowRight')
    await nextFrame()
    await nextFrame()

    expect(stage.dataset.focus).toBe('item')
    expect(document.querySelector('[data-slot-readout]')?.textContent).toBe('02')

    dispatchKey('keydown', 'Enter')
    await nextFrame()

    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'Refraction Veil',
    )
  })

  it('syncs native item focus with the active slot and exposes labelled control groups', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByRole('group', { name: '10-item radial menu' }).element()
    const firstItem = screen
      .getByRole('button', { name: '01 Pulse Beacon, 03 remaining', exact: true })
      .element()
    if (!(firstItem instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the first radial-menu item to be a button')
    }

    expect(screen.getByRole('group', { name: 'Color scheme' }).element()).toBeInstanceOf(
      HTMLDivElement,
    )
    expect(screen.getByRole('group', { name: 'Spiral depth control' }).element()).toBeInstanceOf(
      HTMLDivElement,
    )

    firstItem.focus()
    await nextFrame()
    await nextFrame()

    expect(stage).toHaveAttribute('data-focus', 'item')
    expect(firstItem).toHaveAttribute('data-focused', 'true')
    expect(stage.querySelector('[data-focus-label]')).toMatchTextContent('Pulse Beacon')

    firstItem.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    )
    await nextFrame()
    await nextFrame()

    const secondItem = screen
      .getByRole('button', { name: '02 Refraction Veil, 01 remaining', exact: true })
      .element()
    expect(document.activeElement).toBe(secondItem)
    expect(secondItem).toHaveAttribute('data-focused', 'true')
    expect(document.querySelector('[data-slot-readout]')).toHaveTextContent('02')
  })

  it('keeps the active slot when unrelated page state changes', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()

    movePointer({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height * 0.16,
    })
    await nextFrame()
    await nextFrame()
    expect(stage.dataset.focus).toBe('item')

    const lightButton = screen.getByRole('button', { name: 'Light', exact: true }).element()
    if (!(lightButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the light theme control to be a button')
    }
    lightButton.click()
    await nextFrame()
    await nextFrame()

    expect(stage.dataset.focus).toBe('item')
    dispatchKey('keydown', 'Enter')
    await nextFrame()
    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'Pulse Beacon',
    )
  })

  it('confirms the latest pointer position even before the next animation frame', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()
    const center = {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    }

    dispatchKey('keydown', 'q')
    movePointer({ x: center.x, y: center.y - bounds.height * 0.34 })
    await nextFrame()
    await nextFrame()

    movePointer({ x: center.x + bounds.width * 0.34, y: center.y })
    dispatchKey('keyup', 'q')
    await nextFrame()

    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'Survey Drone',
    )
  })

  it('does not let the global shortcut consume Enter from another control', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()

    movePointer({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height * 0.16,
    })
    await nextFrame()
    await nextFrame()

    const lightButton = screen.getByRole('button', { name: 'Light', exact: true }).element()
    if (!(lightButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the light theme control to be a button')
    }
    lightButton.focus()
    lightButton.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    await nextFrame()

    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'No selection',
    )
  })

  it('keeps Q available when a non-editable control has focus', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const lightButton = screen.getByRole('button', { name: 'Light', exact: true }).element()
    if (!(lightButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the light theme control to be a button')
    }
    lightButton.focus()

    lightButton.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true }),
    )
    await nextFrame()
    expect(stage.dataset.phase).toBe('holding')

    lightButton.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'q', bubbles: true, cancelable: true }),
    )
    await nextFrame()
    expect(stage.dataset.phase).toBe('idle')
  })

  it('ignores repeated global Enter keydown events', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const bounds = stage.getBoundingClientRect()

    movePointer({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height * 0.16,
    })
    await nextFrame()
    await nextFrame()

    const repeatedEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat: true,
      bubbles: true,
      cancelable: true,
    })
    expect(document.dispatchEvent(repeatedEnter)).toBe(true)
    await nextFrame()
    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'No selection',
    )
  })

  it('prevents a held Enter key from repeatedly activating a focused radial item', async () => {
    const screen = await render(<RadialMenuPage />)
    const firstItem = screen.getByRole('button', { name: /Pulse Beacon, 03 remaining/ }).element()
    if (!(firstItem instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the first radial-menu item to be a button')
    }
    let clickCount = 0
    firstItem.addEventListener('click', () => {
      clickCount += 1
    })
    firstItem.focus()

    await userEvent.keyboard('{Enter>3/}')
    await nextFrame()

    expect(clickCount).toBe(1)
    expect(screen.getByText('Last confirmed').element().nextElementSibling).toHaveTextContent(
      'Pulse Beacon',
    )
  })

  it('ends a Q hold when an item is clicked instead of confirming again on Q release', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const firstItem = screen.getByRole('button', { name: /Pulse Beacon, 03 remaining/ }).element()
    if (!(firstItem instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the first radial-menu item to be a button')
    }
    const bounds = stage.getBoundingClientRect()

    dispatchKey('keydown', 'q')
    movePointer({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height * 0.16,
    })
    await nextFrame()
    await nextFrame()
    firstItem.click()
    await nextFrame()

    await wait(300)
    dispatchKey('keyup', 'q')
    await wait(250)

    expect(stage.dataset.phase).toBe('idle')
  })

  it('does not let an earlier confirmation timer end a new hold', async () => {
    const screen = await render(<RadialMenuPage />)
    const stage = screen.getByLabelText('10-item radial menu').element()
    const firstItem = screen.getByRole('button', { name: /Pulse Beacon, 03 remaining/ }).element()
    if (!(firstItem instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the first radial-menu item to be a button')
    }

    firstItem.click()
    await nextFrame()
    dispatchKey('keydown', 'q')
    await nextFrame()
    expect(stage.dataset.phase).toBe('holding')

    await wait(540)
    expect(stage.dataset.phase).toBe('holding')

    dispatchKey('keyup', 'q')
  })

  it('switches light-dark tokens through the page color scheme', async () => {
    const screen = await render(<RadialMenuPage />)
    const page = document.querySelector('main')
    if (!(page instanceof HTMLElement)) throw new TypeError('Expected the radial menu page')

    const darkBackground = getComputedStyle(page).backgroundColor
    expect(getComputedStyle(page).colorScheme).toBe('dark')

    const lightButton = screen.getByRole('button', { name: 'Light', exact: true }).element()
    if (!(lightButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the light theme control to be a button')
    }
    lightButton.click()
    await nextFrame()
    const lightBackground = getComputedStyle(page).backgroundColor
    expect(getComputedStyle(page).colorScheme).toBe('light')
    expect(lightBackground).not.toBe(darkBackground)

    const autoButton = screen.getByRole('button', { name: 'Auto', exact: true }).element()
    if (!(autoButton instanceof HTMLButtonElement)) {
      throw new TypeError('Expected the automatic theme control to be a button')
    }
    autoButton.click()
    await nextFrame()
    expect(getComputedStyle(page).colorScheme).toBe('light dark')
    expect(screen.getByRole('button', { name: 'Auto', exact: true })).toHaveAttribute(
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

    const stage = screen.getByLabelText('8-item radial menu').element()
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

  it('shows confirmation without animation when reduced motion is requested', async () => {
    const screen = await render(<RadialMenuPage />)
    const firstItem = screen.getByRole('button', { name: /Pulse Beacon, 03 remaining/ }).element()
    const confirmation = screen.getByText('Selected').element().parentElement
    if (!(firstItem instanceof HTMLButtonElement) || !(confirmation instanceof HTMLElement)) {
      throw new TypeError('Expected a menu item and its confirmation panel')
    }

    try {
      await setReducedMotion('reduce')
      firstItem.click()
      await nextFrame()

      expect(getComputedStyle(confirmation).animationName).toBe('none')
      expect(Number.parseFloat(getComputedStyle(confirmation).opacity)).toBe(1)
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

function readSectorAngle(stage: Element, index: number) {
  const item = stage.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!item) throw new TypeError(`Expected menu item ${index + 1}`)
  const stageBounds = stage.getBoundingClientRect()
  const itemBounds = item.getBoundingClientRect()
  const dx = itemBounds.left + itemBounds.width / 2 - (stageBounds.left + stageBounds.width / 2)
  const dy = itemBounds.top + itemBounds.height / 2 - (stageBounds.top + stageBounds.height / 2)
  return Math.atan2(dx, -dy)
}

function readVisibleItemCopies(stage: Element, index: number) {
  const stageBounds = stage.getBoundingClientRect()
  const center = {
    x: stageBounds.left + stageBounds.width / 2,
    y: stageBounds.top + stageBounds.height / 2,
  }
  const copies = stage.querySelectorAll<HTMLElement>(
    `[data-item-index="${index}"], [data-index="${index}"]`,
  )

  return Array.from(copies)
    .map((copy) => {
      const bounds = copy.getBoundingClientRect()
      const dx = bounds.left + bounds.width / 2 - center.x
      const dy = bounds.top + bounds.height / 2 - center.y
      return {
        angle: positiveTestModulo(Math.atan2(dx, -dy), Math.PI * 2),
        opacity: Number.parseFloat(getComputedStyle(copy).opacity),
      }
    })
    .filter((copy) => copy.opacity > 0.05)
    .sort((left, right) => left.angle - right.angle)
}

function positiveTestModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
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
