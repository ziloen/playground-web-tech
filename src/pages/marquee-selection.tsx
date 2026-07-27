import '@fontsource-variable/fira-code/index.css'
import '@fontsource-variable/noto-sans-sc/index.css'

import styles from './marquee-selection.module.css'

import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

type Rectangle = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

type GraphemeBox = {
  node: Text
  startOffset: number
  endOffset: number
  rectangles: Rectangle[]
}

type HitRun = {
  first: GraphemeBox
  last: GraphemeBox
  graphemeCount: number
}

type SelectionMode = 'empty' | 'single' | 'multiple' | 'continuous'
type SelectionPhase = 'idle' | 'selecting' | 'complete' | 'cancelled'

type SelectionResult = {
  mode: SelectionMode
  rangeCount: number
  graphemeCount: number
}

type SelectionApplicationResult = SelectionResult & {
  detectedMultipleRangeSupport?: boolean
}

const excludedAncestors =
  'script, style, noscript, template, input, textarea, select, option, [hidden], [aria-hidden="true"]'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export default function MarqueeSelection() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLElement>(null)
  const [eventCounts, setEventCounts] = useState({ click: 0, mouseup: 0 })
  const [focusedControl, setFocusedControl] = useState('无')

  useMarqueeSelection(overlayRef, hudRef)

  const countEvent = (type: 'click' | 'mouseup') => {
    setEventCounts((counts) => ({ ...counts, [type]: counts[type] + 1 }))
  }

  return (
    <main className={styles.page}>
      <div
        ref={overlayRef}
        className={styles.marquee}
        data-active="false"
        data-origin=""
        data-size=""
        data-testid="marquee-overlay"
        aria-hidden="true"
      >
        <span className={styles.originMarker} />
      </div>

      <header className={styles.header}>
        <div className={styles.topline}>
          <span>Selection laboratory</span>
          <span>Native Range / 2026.07</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>矩形命中 · 原生文字选区</p>
            <h1 className={styles.title}>
              框住文字，
              <span>不要拖它。</span>
            </h1>
            <p className={styles.lede}>
              鼠标停在起点，按住 Ctrl + Alt，然后只移动鼠标。没有按下、抬起和 click， 所以带交互的
              label 也不会抢走选区。
            </p>
          </div>

          <aside
            ref={hudRef}
            className={styles.hud}
            data-phase="idle"
            data-testid="marquee-status"
            aria-label="框选状态：等待 Ctrl 加 Alt"
          >
            <div className={styles.hudHeading}>
              <span className={styles.statusDot} aria-hidden="true" />
              <span className={styles.generatedValue} data-marquee-phase data-value="等待快捷键" />
            </div>

            <div className={styles.shortcut} aria-keyshortcuts="Control+Alt">
              <kbd>Ctrl</kbd>
              <span>+</span>
              <kbd>Alt</kbd>
            </div>

            <dl className={styles.metrics}>
              <div>
                <dt>选区策略</dt>
                <dd className={styles.generatedValue} data-marquee-mode data-value="尚未运行" />
              </div>
              <div>
                <dt>原生 Range</dt>
                <dd className={styles.generatedValue} data-marquee-ranges data-value="0" />
              </div>
              <div>
                <dt>命中字素</dt>
                <dd className={styles.generatedValue} data-marquee-graphemes data-value="0" />
              </div>
            </dl>

            <p className={styles.escapeHint}>
              松开任一按键完成
              <span>·</span>
              Esc 清空
            </p>
          </aside>
        </div>
      </header>

      <section className={styles.instructions} aria-label="操作步骤">
        <article>
          <span>01 / 定位</span>
          <p>将鼠标放到矩形起点，不需要点击。</p>
        </article>
        <article>
          <span>02 / 激活</span>
          <p>按住 Ctrl + Alt，旧选区会立即清空。</p>
        </article>
        <article>
          <span>03 / 框选</span>
          <p>移动鼠标；字符中心进入矩形即被命中。</p>
        </article>
        <article>
          <span>04 / 保留</span>
          <p>松开快捷键，矩形消失，原生选区保留。</p>
        </article>
      </section>

      <section className={styles.workbench} aria-labelledby="workbench-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Global selection field</p>
            <h2 id="workbench-title">从任意位置开始框选</h2>
          </div>
          <p>选区不受卡片边界限制。滚动页面也可以继续，起点会固定在文档坐标中。</p>
        </div>

        <article className={styles.specimen} data-index="A">
          <div className={styles.specimenHeading}>
            <span>长文本 / 多行断点</span>
            <span>中心点命中</span>
          </div>

          <div className={styles.proseColumns} data-testid="multiline-sample">
            <p>
              浏览器原生拖选依赖起点、终点和 DOM
              顺序。页面一旦出现分栏、嵌套节点或交互控件，光标经过的路径就不再等于用户眼中看到的区域。
              这套实验把“路径”换成了一个明确的矩形：每个字素都有自己的几何盒，中心落进范围才算命中。
            </p>
            <p>
              在 Firefox 中，不连续的命中片段会成为多个原生 Range；复制、系统高亮与 selectionchange
              仍由浏览器负责。Chrome、Edge 和 Safari
              只接受一个范围，因此会退化为首个命中片段到最后一个命中片段之间的连续选区。
            </p>
            <blockquote>
              试着只框住每一行中间的一小段。Firefox 会留下多段原生高亮，而其他浏览器会展示连续降级。
            </blockquote>
          </div>
        </article>

        <div className={styles.splitRow}>
          <article className={styles.specimen} data-index="B">
            <div className={styles.specimenHeading}>
              <span>混合节点 / DOM 顺序</span>
              <span>原生复制</span>
            </div>

            <div className={styles.mixedCopy}>
              <p>
                文字可以穿过 <strong>强调节点</strong>、行内 <code>code</code> 与
                <a href="#native-note">普通链接</a>，命中仍按页面实际排版计算。
              </p>
              <p>
                这里没有复制按钮，也不会重新拼接字符串。结束后直接按 Ctrl + C，得到的就是浏览器当前
                Selection。
              </p>
            </div>
          </article>

          <article className={styles.specimen} data-index="C">
            <div className={styles.specimenHeading}>
              <span>边界检查 / 滚动</span>
              <span>文档坐标</span>
            </div>

            <div className={styles.coordinateCopy}>
              <span>X</span>
              <p>
                框选起点记录为文档坐标。滚轮移动页面时，起点不会跟着视口漂移；鼠标当前位置则持续换算为新的文档坐标。
              </p>
              <span>Y</span>
            </div>
          </article>
        </div>

        <article className={styles.specimen} data-index="D">
          <div className={styles.specimenHeading}>
            <span>交互样本 / Label</span>
            <span>输入框值不参与</span>
          </div>

          <div className={styles.labelLab}>
            <div className={styles.optionList}>
              <label
                className={styles.option}
                onMouseUp={() => countEvent('mouseup')}
                onClick={() => countEvent('click')}
              >
                <input
                  type="radio"
                  name="selection-mode"
                  defaultChecked
                  onFocus={() => setFocusedControl('精确片段')}
                  onBlur={() => setFocusedControl('无')}
                />
                <span>
                  <strong>精确片段</strong>
                  <small>Firefox 使用多个原生 Range 保留矩形中的离散文字。</small>
                </span>
                <i>01</i>
              </label>

              <label
                className={styles.option}
                onMouseUp={() => countEvent('mouseup')}
                onClick={() => countEvent('click')}
              >
                <input
                  type="radio"
                  name="selection-mode"
                  onFocus={() => setFocusedControl('连续降级')}
                  onBlur={() => setFocusedControl('无')}
                />
                <span>
                  <strong>连续降级</strong>
                  <small>单 Range 浏览器选择首尾之间的完整 DOM 区间。</small>
                </span>
                <i>02</i>
              </label>
            </div>

            <aside className={styles.eventMonitor} aria-label="Label 事件监视器">
              <div>
                <span>Event monitor</span>
                <span className={styles.monitorLight} aria-hidden="true" />
              </div>
              <dl>
                <div>
                  <dt>mouseup</dt>
                  <dd data-testid="event-mouseup">{eventCounts.mouseup}</dd>
                </div>
                <div>
                  <dt>click</dt>
                  <dd data-testid="event-click">{eventCounts.click}</dd>
                </div>
                <div>
                  <dt>当前焦点</dt>
                  <dd data-testid="focused-control">{focusedControl}</dd>
                </div>
              </dl>
              <p>普通点击会更新计数并聚焦输入框；快捷键框选只监听鼠标移动，不会产生这些事件。</p>
            </aside>
          </div>
        </article>
      </section>

      <footer id="native-note" className={styles.footer}>
        <p>Native selection, measured differently.</p>
        <p>输入框与文本域的内部值暂不纳入矩形命中。</p>
      </footer>
    </main>
  )
}

function useMarqueeSelection(
  overlayRef: RefObject<HTMLDivElement | null>,
  hudRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const overlay = overlayRef.current
    const hud = hudRef.current
    if (!overlay || !hud) return

    const abortController = new AbortController()
    const { signal } = abortController

    let active = false
    let startPoint: Point | null = null
    let pointerPosition: Point | null = null
    let graphemeBoxes: GraphemeBox[] = []
    let animationFrame = 0
    let supportsMultipleRanges: boolean | null = null
    let lastResult = emptySelectionResult()

    const renderCurrentSelection = () => {
      if (!active || !startPoint || !pointerPosition) return

      const currentPoint = {
        x: pointerPosition.x + window.scrollX,
        y: pointerPosition.y + window.scrollY,
      }
      const bounds = rectangleFromPoints(startPoint, currentPoint)
      const hasMoved = currentPoint.x !== startPoint.x || currentPoint.y !== startPoint.y
      const hitRuns = hasMoved ? findHitRuns(graphemeBoxes, bounds) : []
      const selection = document.getSelection()
      const result: SelectionApplicationResult = selection
        ? applyNativeSelection(selection, hitRuns, supportsMultipleRanges)
        : emptySelectionResult()

      if (result.detectedMultipleRangeSupport !== undefined) {
        supportsMultipleRanges = result.detectedMultipleRangeSupport
      }
      lastResult = result

      updateOverlay(overlay, bounds, startPoint)
      updateHud(hud, 'selecting', result)
    }

    const scheduleRender = () => {
      if (!active || animationFrame) return

      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0
        renderCurrentSelection()
      })
    }

    const stopSelecting = (phase: Extract<SelectionPhase, 'complete' | 'cancelled'>) => {
      if (!active) return

      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }

      if (phase === 'complete') {
        renderCurrentSelection()
      } else {
        document.getSelection()?.removeAllRanges()
      }

      active = false
      startPoint = null
      graphemeBoxes = []
      delete document.documentElement.dataset.marqueeSelecting
      overlay.dataset.active = 'false'

      const selection = document.getSelection()
      const result =
        phase === 'cancelled' || !selection || selection.rangeCount === 0
          ? emptySelectionResult()
          : lastResult
      updateHud(hud, phase, result)
    }

    const startSelecting = (event: KeyboardEvent) => {
      if (active || !pointerPosition || !(event.ctrlKey && event.altKey)) return

      event.preventDefault()
      document.getSelection()?.removeAllRanges()

      active = true
      startPoint = {
        x: pointerPosition.x + window.scrollX,
        y: pointerPosition.y + window.scrollY,
      }
      graphemeBoxes = collectGraphemeBoxes()
      lastResult = emptySelectionResult()
      document.documentElement.dataset.marqueeSelecting = 'true'
      overlay.dataset.active = 'true'
      updateHud(hud, 'selecting', emptySelectionResult())
      renderCurrentSelection()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && active) {
        event.preventDefault()
        event.stopPropagation()
        stopSelecting('cancelled')
        return
      }

      startSelecting(event)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (!active) return

      if (event.key === 'Control' || event.key === 'Alt' || !(event.ctrlKey && event.altKey)) {
        event.preventDefault()
        stopSelecting('complete')
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerPosition = { x: event.clientX, y: event.clientY }
      scheduleRender()
    }

    const preventPointerInteraction = (event: Event) => {
      if (!active) return

      event.preventDefault()
      event.stopPropagation()
    }

    const onResize = () => {
      if (!active) return
      graphemeBoxes = collectGraphemeBoxes()
      scheduleRender()
    }

    document.addEventListener('keydown', onKeyDown, { capture: true, signal })
    document.addEventListener('keyup', onKeyUp, { capture: true, signal })
    window.addEventListener('pointermove', onPointerMove, { signal })
    window.addEventListener('scroll', scheduleRender, { passive: true, signal })
    window.addEventListener('resize', onResize, { signal })
    window.addEventListener('blur', () => stopSelecting('complete'), { signal })

    for (const eventName of [
      'pointerdown',
      'mousedown',
      'mouseup',
      'click',
      'dragstart',
      'selectstart',
      'contextmenu',
    ]) {
      document.addEventListener(eventName, preventPointerInteraction, {
        capture: true,
        signal,
      })
    }

    return () => {
      abortController.abort()
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (active) delete document.documentElement.dataset.marqueeSelecting
    }
  }, [hudRef, overlayRef])
}

function collectGraphemeBoxes(): GraphemeBox[] {
  if (!document.body) return []

  const boxes: GraphemeBox[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text) || node.data.length === 0) {
        return NodeFilter.FILTER_REJECT
      }

      const parent = node.parentElement
      if (!parent || parent.closest(excludedAncestors)) {
        return NodeFilter.FILTER_REJECT
      }

      return NodeFilter.FILTER_ACCEPT
    },
  })
  const measurementRange = document.createRange()

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const textNode = node as Text

    for (const grapheme of segmenter.segment(textNode.data)) {
      const startOffset = grapheme.index
      const endOffset = startOffset + grapheme.segment.length
      measurementRange.setStart(textNode, startOffset)
      measurementRange.setEnd(textNode, endOffset)

      const rectangles = Array.from(measurementRange.getClientRects())
        .filter((rectangle) => rectangle.width > 0 && rectangle.height > 0)
        .map((rectangle) => ({
          left: rectangle.left + window.scrollX,
          top: rectangle.top + window.scrollY,
          right: rectangle.right + window.scrollX,
          bottom: rectangle.bottom + window.scrollY,
          width: rectangle.width,
          height: rectangle.height,
        }))

      if (rectangles.length > 0) {
        boxes.push({ node: textNode, startOffset, endOffset, rectangles })
      }
    }
  }

  return boxes
}

function findHitRuns(boxes: GraphemeBox[], bounds: Rectangle): HitRun[] {
  const runs: HitRun[] = []
  let currentRun: HitRun | null = null

  for (const box of boxes) {
    const hit = box.rectangles.some((rectangle) => {
      const centerX = rectangle.left + rectangle.width / 2
      const centerY = rectangle.top + rectangle.height / 2

      return (
        centerX >= bounds.left &&
        centerX <= bounds.right &&
        centerY >= bounds.top &&
        centerY <= bounds.bottom
      )
    })

    if (hit) {
      if (currentRun) {
        currentRun.last = box
        currentRun.graphemeCount += 1
      } else {
        currentRun = { first: box, last: box, graphemeCount: 1 }
      }
    } else if (currentRun) {
      runs.push(currentRun)
      currentRun = null
    }
  }

  if (currentRun) runs.push(currentRun)
  return runs
}

function applyNativeSelection(
  selection: Selection,
  runs: HitRun[],
  knownMultipleRangeSupport: boolean | null,
): SelectionApplicationResult {
  selection.removeAllRanges()

  if (runs.length === 0) return emptySelectionResult()

  const exactRanges = runs.map(createRangeForRun)
  const graphemeCount = runs.reduce((total, run) => total + run.graphemeCount, 0)

  if (exactRanges.length === 1) {
    selection.addRange(exactRanges[0])
    return { mode: 'single', rangeCount: 1, graphemeCount }
  }

  let supportsMultiple = knownMultipleRangeSupport
  if (supportsMultiple === null) {
    selection.addRange(exactRanges[0])
    selection.addRange(exactRanges[1])
    supportsMultiple = selection.rangeCount > 1
    selection.removeAllRanges()
  }

  if (supportsMultiple) {
    for (const range of exactRanges) selection.addRange(range)

    return {
      mode: 'multiple',
      rangeCount: selection.rangeCount,
      graphemeCount,
      detectedMultipleRangeSupport: supportsMultiple,
    }
  }

  const continuousRange = document.createRange()
  continuousRange.setStart(runs[0].first.node, runs[0].first.startOffset)
  const lastRun = runs.at(-1)!
  continuousRange.setEnd(lastRun.last.node, lastRun.last.endOffset)
  selection.addRange(continuousRange)

  return {
    mode: 'continuous',
    rangeCount: 1,
    graphemeCount,
    detectedMultipleRangeSupport: supportsMultiple,
  }
}

function createRangeForRun(run: HitRun) {
  const range = document.createRange()
  range.setStart(run.first.node, run.first.startOffset)
  range.setEnd(run.last.node, run.last.endOffset)
  return range
}

function rectangleFromPoints(start: Point, end: Point): Rectangle {
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const right = Math.max(start.x, end.x)
  const bottom = Math.max(start.y, end.y)

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  }
}

function updateOverlay(overlay: HTMLElement, bounds: Rectangle, startPoint: Point) {
  overlay.style.setProperty('--marquee-left', `${bounds.left - window.scrollX}px`)
  overlay.style.setProperty('--marquee-top', `${bounds.top - window.scrollY}px`)
  overlay.style.setProperty('--marquee-width', `${bounds.width}px`)
  overlay.style.setProperty('--marquee-height', `${bounds.height}px`)
  overlay.style.setProperty('--origin-x', `${startPoint.x - bounds.left}px`)
  overlay.style.setProperty('--origin-y', `${startPoint.y - bounds.top}px`)
  overlay.dataset.origin = `x ${Math.round(startPoint.x)} · y ${Math.round(startPoint.y)}`
  overlay.dataset.size = `${Math.round(bounds.width)} × ${Math.round(bounds.height)}`
}

function updateHud(hud: HTMLElement, phase: SelectionPhase, result: SelectionResult) {
  const phaseLabels: Record<SelectionPhase, string> = {
    idle: '等待快捷键',
    selecting: '正在框选',
    complete: result.mode === 'empty' ? '未命中文字' : '选区已保留',
    cancelled: '已取消并清空',
  }
  const modeLabels: Record<SelectionMode, string> = {
    empty: phase === 'idle' ? '尚未运行' : '未命中',
    single: '单一 Range',
    multiple: 'Firefox 多 Range',
    continuous: '连续 Range 降级',
  }

  hud.dataset.phase = phase
  setGeneratedValue(hud, '[data-marquee-phase]', phaseLabels[phase])
  setGeneratedValue(hud, '[data-marquee-mode]', modeLabels[result.mode])
  setGeneratedValue(hud, '[data-marquee-ranges]', String(result.rangeCount))
  setGeneratedValue(hud, '[data-marquee-graphemes]', String(result.graphemeCount))
  hud.setAttribute(
    'aria-label',
    `框选状态：${phaseLabels[phase]}，${modeLabels[result.mode]}，${result.rangeCount} 个原生 Range，命中 ${result.graphemeCount} 个字素`,
  )
}

function setGeneratedValue(root: HTMLElement, selector: string, value: string) {
  root.querySelector<HTMLElement>(selector)?.setAttribute('data-value', value)
}

function emptySelectionResult(): SelectionResult {
  return { mode: 'empty', rangeCount: 0, graphemeCount: 0 }
}
