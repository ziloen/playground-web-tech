import mermaid from 'mermaid'
import { useId } from 'react'
import { mergeRefs } from '~/hooks'
import { toCanvas } from '~/lib/html-to-image'

const defaultTestMermaid = `
flowchart TB
    subgraph 系统架构图
        A["用户界面"] --> B["应用层"]
        B --> C["数据库"]
        B --> D["外部API"]
        
        subgraph 应用层模块
            B --> E["认证模块"]
            B --> F["业务逻辑"]
            B --> G["报表生成器"]
        end
        
        C --> H["主数据库"]
        C --> I["备份数据库"]
        
        style A fill:#f9d5e5,stroke:#333,stroke-width:2px
        style C fill:#e3eaa7,stroke:#333,stroke-width:2px
        style D fill:#c0dfd9,stroke:#333,stroke-width:2px
    end
    
    subgraph 流程示例
        Start(["开始"]) --> Process1["处理数据"]
        Process1 --> Decision{"判断条件？"}
        Decision -->|"是"| Process2["流程A"]
        Decision -->|"否"| Process3["流程B"]
        Process2 --> Join["合并流程"]
        Process3 --> Join
        Join --> END["结束"]
        
        style Start fill:#ffcb91,stroke:#333
        style END fill:#ffcb91,stroke:#333
        style Decision fill:#b5ead7,stroke:#333
    end
    
    subgraph 时间线
        T1["2023年Q1"] --- T2["2023年Q2"]
        T2 --- T3["2023年Q3"]
        T3 --- T4["2023年Q4"]
        T1 --> M1["项目启动"]
        T2 --> M2["开发阶段"]
        T3 --> M3["测试阶段"]
        T4 --> M4["发布上线"]
    end
    
    %% 节点间关系连接
    A -.->|"用户交互"| Start
    Process1 -.->|"使用"| E
    Process2 -.->|"调用"| F
    Process3 -.->|"调用"| G
    Join -.->|"存储"| H
    M4 -.->|"结果"| A
    
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef milestone fill:#c8e6c9,stroke:#43a047,stroke-width:2px;
    class M1,M2,M3,M4 milestone;
`

function downloadDOMImage(node: HTMLElement | null) {
  if (!node) return Promise.reject(new Error('Node is null'))

  return toCanvas(node, {
    useCORS: true,
  }).then((canvas) => {
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'image.png'
      a.click()
      URL.revokeObjectURL(url)
    })
  })
}

export default function DOMToImage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgElement, setSvgElement] = useState<SVGElement | null>(null)
  const mermaidRef = useRef<HTMLElement>(null)

  const [loading, setLoading] = useState(false)

  function captureDOM() {
    const element = containerRef.current
    if (!element) return
    // if (loading) return

    setLoading(true)
    downloadDOMImage(element).finally(() => {
      setLoading(false)
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

        <div className="overflow-auto max-h-[500px]">
          <Mermaid code={defaultTestMermaid} ref={mermaidRef} />
        </div>
      </div>

      <button
        onClick={() => {
          downloadDOMImage(containerRef.current)
        }}
      >
        Capture
      </button>

      <button
        onClick={() => {
          downloadDOMImage(mermaidRef.current)
        }}
      >
        Capture mermaid
      </button>

      {loading && <div>Loading...</div>}

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

function Mermaid({
  code,
  ref,
}: {
  code: string
  ref: React.ForwardedRef<HTMLElement>
}) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = code

    mermaid.render(`mermaid-diagram-${id}`, code, container).then(
      ({ svg, bindFunctions, diagramType }) => {
        containerRef.current!.innerHTML = svg
        bindFunctions?.(container)
      },
    )
  }, [code])

  return (
    <div ref={mergeRefs(containerRef, ref)} id={id}>
    </div>
  )
}
