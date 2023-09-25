


export default function EventBubble() {
  const targetRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const controller = new AbortController()

    targetRef.current.addEventListener('pointerdown', e => {
      console.log('pointerdown', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('pointerup', e => {
      console.log('pointerup', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('pointercancel', e => {
      console.log('pointercancel', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('mousedown', e => {
      console.log('mousedown', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('mouseup', e => {
      console.log('mouseup', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('touchstart', e => {
      console.log('touchstart', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('touchend', e => {
      console.log('touchend', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('touchcancel', e => {
      console.log('touchcancel', e)
    }, { signal: controller.signal })
    targetRef.current.addEventListener('click', e => {
      e.stopImmediatePropagation()
      console.log('click', e)
    }, { signal: controller.signal })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div>
      <div className='select-none cursor-col-resize' ref={targetRef}>Click me</div>
    </div>
  )
}