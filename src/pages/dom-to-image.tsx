import { Button } from 'antd'

export default function DOMToImage() {
  const containerRef = useRef<HTMLDivElement>(null)

  function captureDOM() {
    const element = containerRef.current
    if (!element) return

    const xmlns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(xmlns, 'svg')
    const foreignObject = document.createElementNS(xmlns, 'foreignObject')

    svg.setAttribute('width', String(element.offsetWidth))
    svg.setAttribute('height', String(element.offsetHeight))

    foreignObject.setAttribute('width', '100%')
    foreignObject.setAttribute('height', '100%')
    foreignObject.setAttribute('x', '0')
    foreignObject.setAttribute('y', '0')
    foreignObject.setAttribute('externalResourcesRequired', 'true')

    svg.append(foreignObject)
    foreignObject.append(element.cloneNode(true))

    const svgString = new XMLSerializer().serializeToString(svg)
    const svgDataBase64 = btoa(unescape(encodeURIComponent(svgString)))

    const imageUrl = `data:image/svg+xml;base64,${svgDataBase64}`

    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = element.offsetWidth
      canvas.height = element.offsetHeight

      const context = canvas.getContext('2d')
      if (!context) return

      context.drawImage(img, 0, 0)

      const canvasImageUrl = canvas.toDataURL('image/png')

      const a = document.createElement('a')
      a.href = canvasImageUrl
      a.download = 'dom-to-image.png'
      a.click()
    }
  }

  return (
    <div>
      <div ref={containerRef} className='text-white'>
        dom to image
      </div>

      <Button onClick={captureDOM}>
        Capture
      </Button>
    </div>
  )
}
