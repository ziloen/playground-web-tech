import { Button } from 'antd'
import html2canvas from 'html2canvas'

export default function DOMToImage() {
  const containerRef = useRef<HTMLDivElement>(null)

  function captureDOM() {
    const element = containerRef.current
    if (!element) return

    html2canvas(element, {
      backgroundColor: null,
      foreignObjectRendering: false,
      allowTaint: false,
      useCORS: true,
      onclone(document, element) {
        element.classList.add('w-[300px]')
        element.style.height = 'auto'
      },
    }).then(
      canvas => {
        canvas.toBlob(blob => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'dom-to-image.png'
          a.click()
          URL.revokeObjectURL(url)
        })
      }
    )
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
    </div>
  )
}
