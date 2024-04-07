export default function EventBubble() {
  const targetRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const controller = new AbortController()

    const enventTypes = [
      'pointerdown',
      'pointerup',
      'pointercancel',
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
      'touchcancel',
      'click',
    ] as (keyof HTMLElementEventMap)[]

    enventTypes.forEach((type) => {
      targetRef.current.addEventListener(type, (e) => {
        console.log(type, e)
      }, { signal: controller.signal })
    })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div>
      {targetRef && (
        <div>
          <div>123</div>
        </div>
      )}

      {targetRef && <div>234</div>}
      <div className="select-none cursor-col-resize" ref={targetRef}>Click me</div>
    </div>
  )
}
