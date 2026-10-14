import Panzoom from '@panzoom/panzoom'
import type { PanzoomObject } from '@panzoom/panzoom'

type SvgPreviewProps = {
  ref?: React.Ref<{ reset: () => void }>
  src: string | null
  width: number
  height: number
}

export default function SvgPreview({ ref, src, width, height }: SvgPreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const panzoomRef = useRef<PanzoomObject | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      reset: () => panzoomRef.current?.reset({ animate: false }),
    }),
    [],
  )

  useEffect(() => {
    const viewport = viewportRef.current!
    const content = contentRef.current!
    let disposed = false
    let panning = false
    let releaseTimer: ReturnType<typeof setTimeout>

    function promote() {
      clearTimeout(releaseTimer)
      // Reuse the rasterized SVG while interacting, including its expensive filters.
      content.style.willChange = 'transform'
    }

    function releaseWhenIdle() {
      clearTimeout(releaseTimer)
      if (panning) return
      releaseTimer = setTimeout(() => {
        // Let the browser rasterize at the final scale so the resting preview is sharp.
        content.style.willChange = ''
      }, 180)
    }

    const panzoom = Panzoom(content, {
      canvas: true,
      minScale: 1,
      maxScale: 10,
      animate: false,
      pinchAndPan: true,
      setTransform: (element, { scale, x, y }) => {
        // Panzoom can still have an animation frame queued after destroy().
        if (disposed) return
        promote()
        element.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`
        releaseWhenIdle()
      },
    })
    panzoomRef.current = panzoom

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1
      const delta = Math.max(-100, Math.min(100, event.deltaY * unit))
      if (!delta) return
      promote()
      panzoom.zoomToPoint(panzoom.getScale() * Math.exp(-delta * 0.005), event, { animate: false })
    }

    function onStart() {
      panning = true
      promote()
    }

    function onEnd() {
      panning = false
      releaseWhenIdle()
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    content.addEventListener('panzoomstart', onStart)
    content.addEventListener('panzoomend', onEnd)

    return () => {
      disposed = true
      clearTimeout(releaseTimer)
      viewport.removeEventListener('wheel', onWheel)
      content.removeEventListener('panzoomstart', onStart)
      content.removeEventListener('panzoomend', onEnd)
      panzoom.destroy()
      panzoom.resetStyle()
      content.style.willChange = ''
      panzoomRef.current = null
    }
  }, [src])

  return (
    <div className="relative h-full min-w-0 flex-1">
      <div
        ref={viewportRef}
        data-panzoom-viewport=""
        className="absolute inset-0 overflow-hidden"
        style={{ colorScheme: 'light' }}
        onDoubleClick={(event) => {
          const panzoom = panzoomRef.current
          if (!panzoom) return
          panzoom.zoomToPoint(panzoom.getScale() * 2, event, { animate: false })
        }}
      >
        <div
          ref={contentRef}
          data-panzoom-content=""
          className="grid h-full w-full place-items-center"
        >
          <iframe
            src={src || 'about:blank'}
            title="SVG preview"
            scrolling="no"
            className="pointer-events-none overflow-hidden border-none bg-transparent"
            style={{
              anchorName: '--a',
              width: width ? `${width}px` : '100%',
              height: height ? `${height}px` : '100%',
            }}
          />
        </div>
      </div>
      <div className="absolute top-3 right-3 flex gap-1 rounded bg-dark-gray-300 p-1">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => panzoomRef.current?.zoomOut({ animate: false })}
        >
          −
        </button>
        <button type="button" onClick={() => panzoomRef.current?.reset({ animate: false })}>
          Reset view
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => panzoomRef.current?.zoomIn({ animate: false })}
        >
          +
        </button>
      </div>
    </div>
  )
}
