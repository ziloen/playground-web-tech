import { Button } from 'antd'
import html2canvas from 'html2canvas'

export default function DOMToImage() {
  const containerRef = useRef<HTMLDivElement>(null)

  function captureDOM() {
    const element = containerRef.current
    if (!element) return

    html2canvas(element, { backgroundColor: 'black' }).then(
      canvas => {
        const imageUrl = canvas.toDataURL('image/png')

        const a = document.createElement('a')
        a.href = imageUrl
        a.download = 'dom-to-image.png'
        a.click()
      }
    )
  }

  return (
    <div>
      <div className="p-2">
        <div ref={containerRef} className="text-white border rounded-2xl border-red-200">
          dom to image
        </div>
      </div>

      <Button onClick={captureDOM}>
        Capture
      </Button>
    </div>
  )
}
