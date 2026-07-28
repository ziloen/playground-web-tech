import '@fontsource-variable/fira-code/index.css'
import '@fontsource-variable/noto-sans-sc/index.css'

import styles from './radial-menu.module.css'

import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

type ThemeMode = 'auto' | 'light' | 'dark'
type WheelPhase = 'idle' | 'holding' | 'confirmed' | 'cancelled'
type LoopMode = 'immediate' | 'padded'

type MenuItem = {
  id: string
  label: string
  detail: string
  quantity: string
}

const TAU = Math.PI * 2
const SLOTS_PER_LAP = 8
const SLOT_ANGLE = TAU / SLOTS_PER_LAP
const SECTOR_INNER_RADIUS_RATIO = 0.25
const SECTOR_OUTER_RADIUS_RATIO = 0.43
const SECTOR_ANGULAR_FILL = 0.96
const EMPTY_SLOT_OPACITY = 0.36
const FULLY_VISIBLE_SLOT_DISTANCE = 3
const FADING_SLOT_COUNT = 3
const SPIRAL_COPY_OFFSETS = [-1, 0, 1] as const
const COUNT_OPTIONS = [6, 8, 10, 14] as const

type SpiralCopyOffset = (typeof SPIRAL_COPY_OFFSETS)[number]
type ItemElementCopies = Partial<Record<SpiralCopyOffset, HTMLButtonElement | null>>

const MENU_ITEMS: MenuItem[] = [
  { id: 'pulse', label: '脉冲信标', detail: '标记当前位置并广播短距信号', quantity: '03' },
  { id: 'veil', label: '折光帷幕', detail: '展开一层短时光学遮蔽', quantity: '01' },
  { id: 'drone', label: '侦察浮标', detail: '释放自动测绘单元', quantity: '04' },
  { id: 'capsule', label: '修复胶囊', detail: '恢复附近装置的结构完整度', quantity: '12' },
  { id: 'prism', label: '棱镜扫描', detail: '解析目标表面与能量特征', quantity: '08' },
  { id: 'anchor', label: '重力锚点', detail: '稳定局部空间中的移动目标', quantity: '02' },
  { id: 'flare', label: '冷焰照明', detail: '投射无热高亮标记', quantity: '06' },
  { id: 'relay', label: '远距中继', detail: '建立一次性加密传输链路', quantity: '02' },
  { id: 'phase', label: '相位钥匙', detail: '开启受保护的轨道接口', quantity: '01' },
  { id: 'echo', label: '回声诱饵', detail: '复现最近记录的运动信号', quantity: '05' },
  { id: 'shield', label: '偏转阵列', detail: '部署定向防护屏障', quantity: '02' },
  { id: 'vector', label: '矢量推进', detail: '提供一次受控的方向脉冲', quantity: '07' },
  { id: 'archive', label: '现场归档', detail: '保存当前环境的传感器快照', quantity: '24' },
  { id: 'beacon', label: '返航坐标', detail: '设置下一次回收的导航原点', quantity: '01' },
]

export default function RadialMenuPage() {
  const [itemCount, setItemCount] = useState<(typeof COUNT_OPTIONS)[number]>(10)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [loopMode, setLoopMode] = useState<LoopMode>('padded')
  const [leadingScalePercent, setLeadingScalePercent] = useState(6)
  const [trailingScalePercent, setTrailingScalePercent] = useState(6)
  const [lastSelection, setLastSelection] = useState<MenuItem | null>(null)
  const visibleItems = MENU_ITEMS.slice(0, itemCount)

  return (
    <main
      className={styles.page}
      style={
        {
          colorScheme: theme === 'auto' ? 'light dark' : theme,
        } as CSSProperties
      }
    >
      <header className={styles.topbar}>
        <div className={styles.identity}>
          <span className={styles.identityMark} aria-hidden="true">
            O
          </span>
          <div>
            <strong>Orbital index</strong>
            <span>Radial command field / R-08</span>
          </div>
        </div>

        <div className={styles.themeControl} aria-label="颜色模式">
          {(['auto', 'light', 'dark'] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={theme === mode}
              onClick={() => setTheme(mode)}
            >
              {{ auto: '自动', light: '亮色', dark: '暗色' }[mode]}
            </button>
          ))}
        </div>
      </header>

      <section className={styles.commandDeck} aria-labelledby="radial-menu-title">
        <aside className={styles.intro}>
          <p className={styles.kicker}>Continuous angular input</p>
          <h1 id="radial-menu-title">
            轨道
            <span>指令环</span>
          </h1>
          <p className={styles.introCopy}>
            以圆心为原点移动鼠标。八项以内保持等分圆环，超过八项后，指针的展开弧度会把菜单拉成连续螺旋。
          </p>

          <fieldset className={styles.countControl}>
            <legend>项目数量</legend>
            <div>
              {COUNT_OPTIONS.map((count) => (
                <button
                  type="button"
                  key={count}
                  aria-pressed={itemCount === count}
                  onClick={() => setItemCount(count)}
                >
                  {String(count).padStart(2, '0')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.loopControl}>
            <legend>循环方式</legend>
            <div>
              <button
                type="button"
                aria-pressed={loopMode === 'immediate'}
                onClick={() => setLoopMode('immediate')}
              >
                紧接末项
              </button>
              <button
                type="button"
                aria-pressed={loopMode === 'padded'}
                onClick={() => setLoopMode('padded')}
              >
                补满整圈
              </button>
            </div>
          </fieldset>

          <div className={styles.scaleControls} aria-label="螺旋层级强度">
            <label>
              <span>
                <span className={styles.scaleDescriptor}>
                  <strong>前向展开</strong>
                  <small>放大 · 外移</small>
                </span>
                <output>+{leadingScalePercent}% / 槽</output>
              </span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={leadingScalePercent}
                aria-label="前向展开强度"
                aria-valuetext={`每槽放大并外移 ${leadingScalePercent}%`}
                onChange={(event) => setLeadingScalePercent(Number(event.currentTarget.value))}
              />
            </label>
            <label>
              <span>
                <span className={styles.scaleDescriptor}>
                  <strong>后向收束</strong>
                  <small>缩小 · 内移</small>
                </span>
                <output>−{trailingScalePercent}% / 槽</output>
              </span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={trailingScalePercent}
                aria-label="后向收束强度"
                aria-valuetext={`每槽缩小并内移 ${trailingScalePercent}%`}
                onChange={(event) => setTrailingScalePercent(Number(event.currentTarget.value))}
              />
            </label>
          </div>

          <div className={styles.primaryHint}>
            <kbd>Q</kbd>
            <span>
              <strong>按住选择</strong>
              <small>松开确认 · Esc 取消</small>
            </span>
          </div>
        </aside>

        <RadialWheel
          key={itemCount}
          items={visibleItems}
          loopMode={loopMode}
          leadingScaleRatio={leadingScalePercent / 100}
          trailingScaleRatio={trailingScalePercent / 100}
          onConfirm={(item) => setLastSelection(item)}
        />

        <aside className={styles.telemetry} aria-label="菜单信息">
          <div className={styles.telemetryHeader}>
            <span aria-hidden="true" />
            <p>Input telemetry</p>
          </div>

          <dl>
            <div>
              <dt>轨道模式</dt>
              <dd>{itemCount <= SLOTS_PER_LAP ? '等分圆环' : '连续螺旋'}</dd>
            </div>
            <div>
              <dt>单圈槽位</dt>
              <dd>08</dd>
            </div>
            <div>
              <dt>展开弧度</dt>
              <dd data-angle-readout>0.00 rad</dd>
            </div>
            <div>
              <dt>当前槽位</dt>
              <dd data-slot-readout>—</dd>
            </div>
          </dl>

          <div className={styles.lastSelection} data-empty={!lastSelection}>
            <span>最近确认</span>
            <strong>{lastSelection?.label ?? '尚未选择'}</strong>
            <small>{lastSelection?.detail ?? '松开 Q 或点击项目后显示'}</small>
          </div>
        </aside>
      </section>

      <footer className={styles.footer}>
        <p>
          <span>Pointer</span>
          绕圆心连续旋转
        </p>
        <p>
          <span>Keyboard</span>
          方向键移动 · Enter 确认
        </p>
        <p>
          <span>Touch</span>
          按住中心并向外拖动
        </p>
      </footer>
    </main>
  )
}

function RadialWheel({
  items,
  loopMode,
  leadingScaleRatio,
  trailingScaleRatio,
  onConfirm,
}: {
  items: MenuItem[]
  loopMode: LoopMode
  leadingScaleRatio: number
  trailingScaleRatio: number
  onConfirm: (item: MenuItem) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<ItemElementCopies[]>([])
  const blankRefs = useRef<Array<HTMLDivElement | null>>([])
  const dividerRef = useRef<HTMLDivElement>(null)
  const focusLabelRef = useRef<HTMLDivElement>(null)
  const neutralLabelRef = useRef<HTMLDivElement>(null)
  const confirmTimerRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [confirmedItem, setConfirmedItem] = useState<MenuItem | null>(null)
  const [phase, setPhase] = useState<WheelPhase>('idle')
  const blankSlotCount =
    items.length < SLOTS_PER_LAP
      ? SLOTS_PER_LAP - items.length
      : items.length > SLOTS_PER_LAP && loopMode === 'padded'
        ? Math.ceil(items.length / SLOTS_PER_LAP) * SLOTS_PER_LAP - items.length
        : 0
  const itemCopyOffsets: readonly SpiralCopyOffset[] =
    items.length > SLOTS_PER_LAP ? SPIRAL_COPY_OFFSETS : [0]

  const confirmItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (!item) return

      window.clearTimeout(confirmTimerRef.current)
      setConfirmedItem(item)
      setPhase('confirmed')
      onConfirm(item)
      confirmTimerRef.current = window.setTimeout(() => {
        setPhase('idle')
      }, 520)
    },
    [items, onConfirm],
  )

  useEffect(() => {
    return () => window.clearTimeout(confirmTimerRef.current)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const divider = dividerRef.current
    const focusLabel = focusLabelRef.current
    const neutralLabel = neutralLabelRef.current
    const angleReadout = document.querySelector<HTMLElement>('[data-angle-readout]')
    const slotReadout = document.querySelector<HTMLElement>('[data-slot-readout]')
    if (!stage || !divider || !focusLabel || !neutralLabel) return

    const abortController = new AbortController()
    const { signal } = abortController
    const isSpiral = items.length > SLOTS_PER_LAP
    const ringSlotCount = Math.max(items.length, SLOTS_PER_LAP)
    const cycleSlotCount =
      loopMode === 'immediate'
        ? items.length
        : Math.ceil(items.length / SLOTS_PER_LAP) * SLOTS_PER_LAP
    const focusStep = isSpiral ? SLOT_ANGLE : TAU / ringSlotCount

    let animationFrame = 0
    let active = null as number | null
    let unwrappedAngle = 0
    let lastWrappedAngle = null as number | null
    let lastPointer = null as { x: number; y: number } | null
    let pointerDistance = 0
    let pointerInDeadZone = true
    let hasPointer = false
    let qHeld = false
    let qCancelled = false
    let dragPointerId = null as number | null
    let displayedLabelSlot = null as number | null

    const updateActive = (nextActive: number | null) => {
      if (active === nextActive) return
      active = nextActive
      setActiveIndex(nextActive)
    }

    const render = () => {
      animationFrame = 0
      const rect = stage.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      const outerRadius = size * SECTOR_OUTER_RADIUS_RATIO
      const deadZone = Math.max(50, size * 0.105)
      const focusPosition = unwrappedAngle / focusStep
      const nearestSlot = Math.round(focusPosition)
      const logicalSlot = positiveModulo(nearestSlot, isSpiral ? cycleSlotCount : ringSlotCount)
      const nextActive = pointerInDeadZone || logicalSlot >= items.length ? null : logicalSlot

      updateActive(nextActive)
      stage.dataset.focus = pointerInDeadZone ? 'dead' : nextActive === null ? 'blank' : 'item'
      stage.dataset.pointer = hasPointer ? 'tracking' : 'none'
      stage.style.setProperty('--dead-zone', `${deadZone}px`)
      stage.style.setProperty('--pointer-angle', `${positiveModulo(unwrappedAngle, TAU)}rad`)
      stage.style.setProperty('--pointer-length', `${Math.min(pointerDistance, outerRadius)}px`)
      if (lastPointer) {
        const tiltX = Math.max(
          -4,
          Math.min(4, ((rect.top + rect.height / 2 - lastPointer.y) / (rect.height / 2)) * 4),
        )
        const tiltY = Math.max(
          -4,
          Math.min(4, ((lastPointer.x - (rect.left + rect.width / 2)) / (rect.width / 2)) * 4),
        )
        stage.style.setProperty('--tilt-x', `${tiltX.toFixed(3)}deg`)
        stage.style.setProperty('--tilt-y', `${tiltY.toFixed(3)}deg`)
      } else {
        stage.style.setProperty('--tilt-x', '0deg')
        stage.style.setProperty('--tilt-y', '0deg')
      }

      if (angleReadout) angleReadout.textContent = `${unwrappedAngle.toFixed(2)} rad`
      if (slotReadout) {
        slotReadout.textContent =
          nextActive === null ? '—' : String(nextActive + 1).padStart(2, '0')
      }

      if (isSpiral) {
        renderSpiralItems({
          elements: itemRefs.current,
          blankElements: blankRefs.current,
          divider,
          focusPosition,
          itemCount: items.length,
          paddedSlotCount: cycleSlotCount,
          size,
          activeIndex: nextActive,
          leadingScaleRatio,
          trailingScaleRatio,
        })
      } else {
        renderRingItems({
          elements: itemRefs.current,
          blankElements: blankRefs.current,
          itemCount: items.length,
          slotCount: ringSlotCount,
          size,
          activeIndex: nextActive,
        })
        divider.style.opacity = '0'
      }

      if (displayedLabelSlot !== logicalSlot) {
        updateFocusLabel(focusLabel, items, logicalSlot)
        displayedLabelSlot = logicalSlot
      }
      focusLabel.style.opacity = pointerInDeadZone ? '0' : '1'
      neutralLabel.textContent = pointerInDeadZone ? '中心安全区' : '轨道留白'
    }

    const scheduleRender = () => {
      if (animationFrame) return
      animationFrame = requestAnimationFrame(render)
    }

    const setPointerPosition = (clientX: number, clientY: number) => {
      lastPointer = { x: clientX, y: clientY }
      hasPointer = true
      const rect = stage.getBoundingClientRect()
      const dx = clientX - (rect.left + rect.width / 2)
      const dy = clientY - (rect.top + rect.height / 2)
      const size = Math.min(rect.width, rect.height)
      const deadZone = Math.max(50, size * 0.105)
      pointerDistance = Math.hypot(dx, dy)
      pointerInDeadZone = pointerDistance <= deadZone

      if (pointerDistance > 0.5) {
        const wrappedAngle = positiveModulo(Math.atan2(dx, -dy), TAU)

        if (lastWrappedAngle === null) {
          const nearestTurn = Math.round((unwrappedAngle - wrappedAngle) / TAU)
          unwrappedAngle = wrappedAngle + nearestTurn * TAU
        } else {
          let delta = wrappedAngle - lastWrappedAngle
          if (delta > Math.PI) delta -= TAU
          if (delta < -Math.PI) delta += TAU
          unwrappedAngle += delta
        }

        lastWrappedAngle = wrappedAngle
      }

      scheduleRender()
    }

    const resetWheel = () => {
      unwrappedAngle = 0
      lastWrappedAngle = null
      pointerInDeadZone = true
      pointerDistance = 0
      hasPointer = false
      lastPointer = null
      updateActive(null)
      scheduleRender()
    }

    const cancelSelection = () => {
      qHeld = false
      qCancelled = true
      setPhase('cancelled')
      resetWheel()
      window.clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = window.setTimeout(() => setPhase('idle'), 280)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && dragPointerId !== event.pointerId) return

      const rect = stage.getBoundingClientRect()
      const isInsideStage =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!qHeld && dragPointerId === null && !isInsideStage) return
      setPointerPosition(event.clientX, event.clientY)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      event.preventDefault()
      dragPointerId = event.pointerId
      stage.setPointerCapture(event.pointerId)
      resetWheel()
      setPhase('holding')
      setPointerPosition(event.clientX, event.clientY)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (dragPointerId !== event.pointerId) return
      event.preventDefault()
      dragPointerId = null
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
      if (active !== null) confirmItem(active)
      else setPhase('idle')
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      if (isTextInput) return

      if (event.key.toLowerCase() === 'q') {
        if (event.repeat || qHeld) return
        event.preventDefault()
        qHeld = true
        qCancelled = false
        setPhase('holding')
        resetWheel()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        cancelSelection()
        return
      }

      const direction =
        event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? -1
            : 0

      if (direction !== 0) {
        event.preventDefault()
        const currentSlot = Math.round(unwrappedAngle / focusStep)
        unwrappedAngle = (currentSlot + direction) * focusStep
        lastWrappedAngle = positiveModulo(unwrappedAngle, TAU)
        pointerInDeadZone = false
        pointerDistance = stage.getBoundingClientRect().width * 0.34
        hasPointer = true
        scheduleRender()
        return
      }

      if (event.key === 'Enter' && active !== null) {
        event.preventDefault()
        confirmItem(active)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'q' || !qHeld) return
      event.preventDefault()
      qHeld = false
      if (!qCancelled && active !== null) confirmItem(active)
      else setPhase('idle')
    }

    const onWindowBlur = () => {
      if (qHeld || dragPointerId !== null) cancelSelection()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true, signal })
    stage.addEventListener('pointerdown', onPointerDown, { signal })
    stage.addEventListener('pointerup', onPointerUp, { signal })
    stage.addEventListener('pointercancel', onPointerUp, { signal })
    document.addEventListener('keydown', onKeyDown, { signal })
    document.addEventListener('keyup', onKeyUp, { signal })
    window.addEventListener('blur', onWindowBlur, { signal })
    window.addEventListener('resize', scheduleRender, { signal })

    render()

    return () => {
      abortController.abort()
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [confirmItem, items, leadingScaleRatio, loopMode, trailingScaleRatio])

  return (
    <div className={styles.wheelFrame}>
      <div className={styles.coordinateLabel} aria-hidden="true">
        <span>−π</span>
        <span>0</span>
        <span>+π</span>
      </div>

      <div
        ref={stageRef}
        className={styles.wheel}
        data-phase={phase}
        data-focus="dead"
        data-mode={items.length > SLOTS_PER_LAP ? 'spiral' : 'ring'}
        aria-label={`${items.length} 项径向菜单`}
      >
        <div className={styles.tiltPlane} data-tilt-plane>
          <div className={styles.orbitLines} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <div className={styles.pointerRay} aria-hidden="true">
            <span data-pointer-indicator />
          </div>

          <div className={styles.track}>
            <div
              ref={dividerRef}
              className={styles.cycleDivider}
              data-cycle-divider
              aria-hidden="true"
            >
              <span>LOOP</span>
            </div>

            {items.flatMap((item, index) =>
              itemCopyOffsets.map((cycleOffset) => (
                <button
                  type="button"
                  ref={(element) => {
                    const copies = itemRefs.current[index] ?? {}
                    copies[cycleOffset] = element
                    itemRefs.current[index] = copies
                  }}
                  className={styles.item}
                  key={`${item.id}-${cycleOffset}`}
                  data-index={cycleOffset === 0 ? index : undefined}
                  data-item-index={index}
                  data-cycle-copy={cycleOffset}
                  data-focused={activeIndex === index && cycleOffset === 0}
                  aria-hidden={cycleOffset === 0 ? undefined : true}
                  aria-label={
                    cycleOffset === 0 ? `${item.label}，余量 ${item.quantity}` : undefined
                  }
                  tabIndex={cycleOffset === 0 ? undefined : -1}
                  onClick={() => confirmItem(index)}
                >
                  <span className={styles.itemContent}>
                    <span className={styles.itemIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.itemGlyph} aria-hidden="true">
                      <ItemGlyph index={index} />
                    </span>
                    <span className={styles.itemQuantity}>{item.quantity}</span>
                  </span>
                </button>
              )),
            )}

            {Array.from({ length: blankSlotCount }, (_, index) => (
              <div
                ref={(element) => {
                  blankRefs.current[index] = element
                }}
                className={`${styles.item} ${styles.blankItem}`}
                key={`empty-${items.length + index}`}
                data-empty-slot={items.length + index}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className={styles.core}>
            <div className={styles.coreBracket} aria-hidden="true" />
            <div
              ref={focusLabelRef}
              className={styles.focusLabel}
              data-focus-label
              aria-hidden="true"
            />
            <div ref={neutralLabelRef} className={styles.neutralLabel}>
              中心安全区
            </div>
            <span className={styles.coreInstruction}>
              {phase === 'holding' ? '松开 Q 确认' : '移出圆心以选择'}
            </span>
          </div>

          <div className={styles.confirmation} aria-live="polite">
            <span>已选择</span>
            <strong>{confirmedItem?.label ?? ''}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderRingItems({
  elements,
  blankElements,
  itemCount,
  slotCount,
  size,
  activeIndex,
}: {
  elements: ItemElementCopies[]
  blankElements: Array<HTMLDivElement | null>
  itemCount: number
  slotCount: number
  size: number
  activeIndex: number | null
}) {
  const angularSpan = (TAU / slotCount) * SECTOR_ANGULAR_FILL
  const geometry = createSectorGeometry(size, angularSpan)

  for (let index = 0; index < itemCount; index += 1) {
    const element = elements[index]?.[0]
    if (!element) continue
    const angle = (index / slotCount) * TAU
    setSectorTransform(element, geometry, angle, 1)
    element.style.opacity = '1'
    element.style.zIndex = activeIndex === index ? '20' : '10'
    element.style.pointerEvents = 'auto'
    element.dataset.direction = 'current'
  }

  for (let index = 0; index < blankElements.length; index += 1) {
    const element = blankElements[index]
    if (!element) continue
    const slotIndex = itemCount + index
    const angle = (slotIndex / slotCount) * TAU
    setSectorTransform(element, geometry, angle, 1)
    element.style.opacity = EMPTY_SLOT_OPACITY.toFixed(3)
    element.style.zIndex = '8'
    element.style.pointerEvents = 'none'
    element.dataset.direction = 'current'
  }
}

function renderSpiralItems({
  elements,
  blankElements,
  divider,
  focusPosition,
  itemCount,
  paddedSlotCount,
  size,
  activeIndex,
  leadingScaleRatio,
  trailingScaleRatio,
}: {
  elements: ItemElementCopies[]
  blankElements: Array<HTMLDivElement | null>
  divider: HTMLElement
  focusPosition: number
  itemCount: number
  paddedSlotCount: number
  size: number
  activeIndex: number | null
  leadingScaleRatio: number
  trailingScaleRatio: number
}) {
  const geometry = createSectorGeometry(size, SLOT_ANGLE * SECTOR_ANGULAR_FILL)

  for (let index = 0; index < itemCount; index += 1) {
    const nearestCycle = Math.round((focusPosition - index) / paddedSlotCount)

    for (const cycleOffset of SPIRAL_COPY_OFFSETS) {
      const element = elements[index]?.[cycleOffset]
      if (!element) continue
      const trackPosition = index + (nearestCycle + cycleOffset) * paddedSlotCount
      const distance = trackPosition - focusPosition
      const angle = trackPosition * SLOT_ANGLE
      const scale = spiralScale(distance, leadingScaleRatio, trailingScaleRatio)
      const opacity = spiralVisibility(distance)
      const isPrimaryCopy = cycleOffset === 0

      setSectorTransform(element, geometry, angle, scale)
      element.style.opacity = opacity.toFixed(3)
      element.style.zIndex = String(
        Math.round(scale * 10) + (isPrimaryCopy && activeIndex === index ? 20 : 0),
      )
      element.style.pointerEvents = opacity > 0.16 ? 'auto' : 'none'
      element.dataset.direction =
        Math.abs(distance) < 0.5 ? 'current' : distance < 0 ? 'before' : 'after'
    }
  }

  for (let index = 0; index < blankElements.length; index += 1) {
    const element = blankElements[index]
    if (!element) continue
    const slotIndex = itemCount + index
    const nearestCycle = Math.round((focusPosition - slotIndex) / paddedSlotCount)
    const trackPosition = slotIndex + nearestCycle * paddedSlotCount
    const distance = trackPosition - focusPosition
    const angle = trackPosition * SLOT_ANGLE
    const scale = spiralScale(distance, leadingScaleRatio, trailingScaleRatio)
    const opacity = spiralVisibility(distance) * EMPTY_SLOT_OPACITY

    setSectorTransform(element, geometry, angle, scale)
    element.style.opacity = opacity.toFixed(3)
    element.style.zIndex = String(Math.round(scale * 10))
    element.style.pointerEvents = 'none'
    element.dataset.direction =
      Math.abs(distance) < 0.5 ? 'current' : distance < 0 ? 'before' : 'after'
  }

  const dividerTrackPosition =
    Math.round((focusPosition + 0.48) / paddedSlotCount) * paddedSlotCount - 0.48
  const dividerDistance = dividerTrackPosition - focusPosition
  const dividerAngle = dividerTrackPosition * SLOT_ANGLE
  const dividerScale = spiralScale(dividerDistance, leadingScaleRatio, trailingScaleRatio)
  const dividerRadius = geometry.centerRadius * dividerScale
  const dividerX = Math.sin(dividerAngle) * dividerRadius
  const dividerY = -Math.cos(dividerAngle) * dividerRadius
  const dividerOpacity = spiralVisibility(dividerDistance)

  divider.style.transform = `translate3d(calc(-50% + ${dividerX.toFixed(2)}px), calc(-50% + ${dividerY.toFixed(2)}px), 0) rotate(${dividerAngle}rad) scale(${dividerScale.toFixed(3)})`
  divider.style.opacity = dividerOpacity.toFixed(3)
}

type SectorGeometry = {
  width: number
  height: number
  centerRadius: number
  clipPath: string
  fillClipPath: string
  innerRadius: number
  outerRadius: number
}

function createSectorGeometry(size: number, angularSpan: number): SectorGeometry {
  const innerRadius = size * SECTOR_INNER_RADIUS_RATIO
  const outerRadius = size * SECTOR_OUTER_RADIUS_RATIO
  const halfAngle = angularSpan / 2
  const halfWidth = outerRadius * Math.sin(halfAngle)
  const width = halfWidth * 2
  const height = outerRadius - innerRadius * Math.cos(halfAngle)
  const centerRadius = outerRadius - height / 2
  const clipPath = sectorPath({
    boxCenterX: halfWidth,
    circleCenterY: outerRadius,
    innerRadius,
    outerRadius,
    halfAngle,
  })
  const strokeInset = Math.max(1, size / 720)
  const fillHalfAngle = Math.max(0, halfAngle - strokeInset / centerRadius)
  const fillClipPath = sectorPath({
    boxCenterX: halfWidth,
    circleCenterY: outerRadius,
    innerRadius: innerRadius + strokeInset,
    outerRadius: outerRadius - strokeInset,
    halfAngle: fillHalfAngle,
  })

  return {
    width,
    height,
    centerRadius,
    clipPath,
    fillClipPath,
    innerRadius,
    outerRadius,
  }
}

function sectorPath({
  boxCenterX,
  circleCenterY,
  innerRadius,
  outerRadius,
  halfAngle,
}: {
  boxCenterX: number
  circleCenterY: number
  innerRadius: number
  outerRadius: number
  halfAngle: number
}) {
  const outerOffsetX = outerRadius * Math.sin(halfAngle)
  const outerY = circleCenterY - outerRadius * Math.cos(halfAngle)
  const innerOffsetX = innerRadius * Math.sin(halfAngle)
  const innerY = circleCenterY - innerRadius * Math.cos(halfAngle)

  return `path("M ${(boxCenterX - outerOffsetX).toFixed(2)} ${outerY.toFixed(2)} A ${outerRadius.toFixed(2)} ${outerRadius.toFixed(2)} 0 0 1 ${(boxCenterX + outerOffsetX).toFixed(2)} ${outerY.toFixed(2)} L ${(boxCenterX + innerOffsetX).toFixed(2)} ${innerY.toFixed(2)} A ${innerRadius.toFixed(2)} ${innerRadius.toFixed(2)} 0 0 0 ${(boxCenterX - innerOffsetX).toFixed(2)} ${innerY.toFixed(2)} Z")`
}

function setSectorTransform(
  element: HTMLElement,
  geometry: SectorGeometry,
  angle: number,
  visualScale: number,
) {
  const radius = geometry.centerRadius * visualScale
  const x = Math.sin(angle) * radius
  const y = -Math.cos(angle) * radius

  element.style.width = `${geometry.width.toFixed(2)}px`
  element.style.height = `${geometry.height.toFixed(2)}px`
  element.style.clipPath = geometry.clipPath
  element.style.setProperty('--sector-fill-clip', geometry.fillClipPath)
  element.style.setProperty('--sector-inner-radius', `${geometry.innerRadius.toFixed(2)}px`)
  element.style.setProperty('--sector-outer-radius', `${geometry.outerRadius.toFixed(2)}px`)
  element.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), 0) rotate(${angle}rad) scale(${visualScale.toFixed(3)})`

  const content = element.firstElementChild
  if (content instanceof HTMLElement) {
    content.style.transform = `rotate(${-angle}rad)`
  }
}

function spiralVisibility(distance: number) {
  const absoluteDistance = Math.abs(distance)
  const hiddenDistance = FULLY_VISIBLE_SLOT_DISTANCE + FADING_SLOT_COUNT + 1
  if (absoluteDistance <= FULLY_VISIBLE_SLOT_DISTANCE) return 1
  if (absoluteDistance >= hiddenDistance) return 0
  return 1 - smoothstep(FULLY_VISIBLE_SLOT_DISTANCE, hiddenDistance, absoluteDistance)
}

function spiralScale(distance: number, leadingScaleRatio: number, trailingScaleRatio: number) {
  return distance < 0
    ? Math.min(1.45, 1 + Math.min(-distance, 3) * leadingScaleRatio)
    : Math.max(0.55, 1 - Math.min(distance, 5) * trailingScaleRatio)
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const normalized = Math.min(1, Math.max(0, (value - edgeStart) / (edgeEnd - edgeStart)))
  return normalized * normalized * (3 - 2 * normalized)
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function updateFocusLabel(element: HTMLElement, items: MenuItem[], slot: number) {
  const item = items[slot]
  if (!item) {
    element.innerHTML =
      '<span>EMPTY ARC</span><strong>轨道留白</strong><small>继续旋转以进入下一循环</small>'
    return
  }

  element.innerHTML = `<span>SLOT ${String(slot + 1).padStart(2, '0')}</span><strong>${item.label}</strong><small>${item.detail}</small>`
}

function ItemGlyph({ index }: { index: number }) {
  const glyphs: ReactNode[] = [
    <g key="pulse">
      <circle cx="12" cy="12" r="7" />
      <path d="M3 12h4l2-4 3 8 2-4h7" />
    </g>,
    <g key="veil">
      <path d="M5 17 12 3l7 14-7 4-7-4Z" />
      <path d="m8 15 4-8 4 8-4 2-4-2Z" />
    </g>,
    <g key="drone">
      <path d="m5 9 7-5 7 5v7l-7 4-7-4V9Z" />
      <path d="M2 12h3m14 0h3M12 1v3m0 16v3" />
    </g>,
    <g key="capsule">
      <rect x="5" y="3" width="14" height="18" rx="7" />
      <path d="M5 12h14M12 7v10M8 12h8" />
    </g>,
    <g key="prism">
      <path d="M4 8V4h4m8 0h4v4m0 8v4h-4m-8 0H4v-4" />
      <circle cx="12" cy="12" r="4" />
      <path d="m9 12 2 2 4-5" />
    </g>,
    <g key="anchor">
      <path d="M4 16 12 3l8 13-8 5-8-5Z" />
      <path d="M8 16h8M12 3v13" />
    </g>,
    <g key="flare">
      <path d="M12 2c1 5-4 6-4 11a4 4 0 0 0 8 0c0-3-2-5-4-7" />
      <path d="M12 13c-1 2-1 4 0 6" />
    </g>,
    <g key="relay">
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <path d="M9 12h6M12 5v14" />
    </g>,
    <g key="phase">
      <circle cx="8" cy="9" r="4" />
      <path d="m11 12 8 8m-3-3 2-2m-5 0 2-2" />
    </g>,
    <g key="echo">
      <path d="M4 12a8 8 0 1 1 3 6" />
      <path d="M4 17v-5h5M9 8c4-3 7 1 4 4s0 7 4 4" />
    </g>,
    <g key="shield">
      <path d="M12 3 20 7v5c0 5-3 8-8 10-5-2-8-5-8-10V7l8-4Z" />
      <path d="M8 12h8" />
    </g>,
    <g key="vector">
      <path d="M4 17 12 3l8 14-8 4-8-4Z" />
      <path d="M8 17h8M12 3v18" />
    </g>,
    <g key="archive">
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h8M8 12h5M8 15h7" />
      <path d="M2 8V2h6m8 0h6v6m0 8v6h-6M8 22H2v-6" />
    </g>,
    <g key="beacon">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
    </g>,
  ]

  return (
    <svg viewBox="0 0 24 24" role="presentation">
      {glyphs[index % glyphs.length]}
    </svg>
  )
}
