import { Button } from 'antd'
import { toSvgElement } from '~/lib/html-to-image'

export default function DOMToImage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgElement, setSvgElement] = useState<SVGElement | null>(null)

  function captureDOM() {
    const element = containerRef.current
    if (!element) return

    toSvgElement(element, {
      useCORS: true,
      style: {
        height: 'max-content',
      },
    }).then((svg) => {
      setSvgElement(svg)
    })
  }

  return (
    <div>
      <div className="">
        <div
          ref={containerRef}
          className="text-white border rounded-2xl overflow-hidden border-red-200 border-solid h-[100px]"
        >
          <div>dom to image</div>
          <img
            className="w-full"
            src="https://images.unsplash.com/photo-1719370281932-299f40a5d8ee?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
          <div>dom to image</div>
        </div>
      </div>

      <Button onClick={captureDOM}>
        Capture
      </Button>

      <div>
        {svgElement && <TeleportElement element={svgElement} />}
      </div>
    </div>
  )
}

function TeleportElement({ element }: { element: Element }) {
  const ref = useRef<HTMLDivElement>(null!)

  useLayoutEffect(() => {
    const parent = element.parentNode

    if (!parent) {
      ref.current.append(element)

      return () => element.remove()
    }

    const placeholder = document.createComment('Teleport placeholder')

    element.replaceWith(placeholder)
    ref.current.append(element)

    return () => placeholder.replaceWith(element)
  }, [element])

  return <div ref={ref} className="contents"></div>
}
