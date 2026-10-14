import JSON5 from 'json5'
import type { CustomPlugin, DataUri } from 'svgo/browser'
import { builtinPlugins, optimize, VERSION } from 'svgo/browser'
import type { JsonObject, JsonValue } from 'type-fest'
import SvgPreview from '~/components/SvgPreview'
import { useAutoResetState } from '~/hooks'
import { formatBytes } from '~/utils'
import CarbonCheckmark from '~icons/carbon/checkmark'
import CarbonCopy from '~icons/carbon/copy'

// FIXME: Some svg are broken after optimized by svgo
export default function SVGOPage() {
  // #region useState, useHookState
  const [originalSvg, setOriginalSvg] = useState<string | null>(null)
  const [optimizedSvg, setOptimizedSvg] = useState<string | null>(null)
  const [svgUri, setSvgUri] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('image.svg')
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  })
  const [copied, setCopied] = useAutoResetState(false, 2_000)
  const [showGridLines, setShowGridLines] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  // #endregion

  // #region useRef
  const previewRef = useRef<ComponentRef<typeof SvgPreview>>(null)
  const importRequestRef = useRef(0)
  // #endregion

  // #region useMemo
  // #endregion

  // #region functions, useImperativeHandle
  function loadSvg(value: string, fileName = 'image.svg') {
    const { data, dimensions } = optimizeSvg(value, { pretty: true })
    const uri = optimizeSvgToDataUri(value)

    importRequestRef.current += 1
    setOriginalSvg(value)
    setOptimizedSvg(data)
    setDimensions(dimensions)
    setSvgUri(uri)
    setDownloadName(fileName)
    setImportError(null)
    previewRef.current?.reset()
  }

  async function openSvgFiles(files: FileList) {
    const request = ++importRequestRef.current

    setImportError(null)
    try {
      const { value, name } = await readSvgFile(files)
      if (request !== importRequestRef.current) return

      loadSvg(value, name)
    } catch (error: unknown) {
      console.error('Unable to open SVG file:', error)
      if (request === importRequestRef.current) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error ? error.message : null
        setImportError(typeof message === 'string' ? message : 'Unable to open this SVG file.')
      }
    }
  }
  // #endregion

  // #region useHookEffect, useEffect
  useEffect(() => {
    Reflect.set(window, 'optimizeSvg', optimizeSvg)
  }, [])
  // #endregion

  return (
    <SvgFileDropZone onFiles={openSvgFiles}>
      {/* Left side menus */}
      <div className="h-full w-60 bg-dark-gray-300">
        <div className="px-4 py-1">
          Powered by{' '}
          <a href="https://github.com/svg/svgo" target="_blank" rel="noreferrer">
            SVGO
          </a>{' '}
          {VERSION}
        </div>

        <SvgFileInput onFiles={openSvgFiles} error={importError} />

        <textarea
          className="w-full resize-none border-none bg-transparent px-4 py-3 placeholder:text-inherit placeholder:transition-opacity hover:bg-dark-gray-400 focus:outline-none focus:placeholder:opacity-40"
          rows={1}
          style={{
            fontSize: 'inherit',
            lineHeight: 'inherit',
            fontFamily: 'inherit',
            color: 'inherit',
          }}
          placeholder="Paste markup"
          onInput={(e) => {
            const value = e.currentTarget.value.trim()
            e.currentTarget.blur()
            e.currentTarget.value = ''

            if (!value) {
              return
            }

            if (value.startsWith('{') || value.startsWith('[')) {
              // JSON input
              try {
                const json = JSON5.parse<JsonValue>(value)

                const optimizedJson = optimizeJsonObject(json)
                console.info('Optimized JSON:', optimizedJson)
              } catch (error) {
                console.error('Invalid JSON input:', error)
              }
            }

            if (value.startsWith('<svg')) {
              // SVG input
              try {
                loadSvg(value)
              } catch (error) {
                console.error('Invalid SVG input:', error)
              }
            } else if (value.startsWith('data:image/svg+xml,')) {
              // Data URL input
              try {
                const svgString = decodeURIComponent(value.slice('data:image/svg+xml,'.length))
                loadSvg(svgString)
              } catch (error) {
                console.error('Invalid SVG data URL input:', error)
              }
            }
          }}
        />

        <div
          className="cursor-pointer px-4 py-3 hover:bg-dark-gray-400"
          onClick={() => {
            import('../assets/figma.svg?raw').then((v) => {
              loadSvg(v.default)
            })
          }}
        >
          Demo
        </div>

        <div
          className="cursor-pointer px-4 py-3 hover:bg-dark-gray-400"
          onClick={() => setShowGridLines(!showGridLines)}
        >
          Toggle Grid Lines
        </div>
      </div>

      {/* TODO: configuration */}

      {/* SVG preview */}
      <SvgPreview
        ref={previewRef}
        src={svgUri}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* FIXME: Firefox 和 Chrome 对待 anchor-position transform 行为不一致 */}
      {/* Chrome 会跟随 transform，Firefox 不会 */}
      {/* https://github.com/w3c/csswg-drafts/issues/13782 */}
      {showGridLines && (
        <>
          <div
            className="pointer-events-none absolute border-x border-x-dashed border-blue-200/80"
            style={{
              insetBlock: 'min(0px, anchor(--a start)) min(0px, anchor(--a end))',
              insetInline: 'anchor(--a start) anchor(--a end)',
            }}
          />
          <div
            className="pointer-events-none absolute border-y border-y-dashed border-blue-200/80"
            style={{
              insetBlock: 'anchor(--a start) anchor(--a end)',
              insetInline: 'min(0px, anchor(--a start)) min(0px, anchor(--a end))',
            }}
          />
        </>
      )}

      {/* Right side menus */}
      <div className={clsx('relative', optimizedSvg ? 'block' : 'hidden')}>
        <div className="absolute right-0 bottom-0 grid justify-items-end">
          {!!originalSvg && !!optimizedSvg && (
            <SizeCompare originalSvg={originalSvg} optimizedSvg={optimizedSvg} />
          )}

          {/* Copy text */}
          {!!optimizedSvg && <CopyButton text={optimizedSvg}></CopyButton>}

          {/* Download svg */}
          {!!svgUri && (
            <>
              {/* Copy as data url */}
              <CopyButton text={svgUri}>data URL</CopyButton>

              <a href={svgUri} download={downloadName}>
                Download
              </a>
            </>
          )}
        </div>
      </div>
    </SvgFileDropZone>
  )
}

async function readSvgFile(files: FileList) {
  if (files.length !== 1) {
    throw new Error('Open one SVG file at a time.')
  }

  const file = files[0]
  if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
    throw new Error('Choose an SVG file (.svg).')
  }

  const value = await file.text()
  const svgDocument = new DOMParser().parseFromString(value, 'image/svg+xml')
  if (svgDocument.querySelector('parsererror') || svgDocument.documentElement.localName !== 'svg') {
    throw new Error('This file does not contain valid SVG markup.')
  }

  return { value, name: file.name }
}

function SvgFileDropZone({
  children,
  onFiles,
}: {
  children: React.ReactNode
  onFiles: (files: FileList) => void
}) {
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const dragDepthRef = useRef(0)

  return (
    <div
      className="relative flex h-full"
      style={{
        backgroundImage: 'repeating-conic-gradient(#3b3b3b 0 25%, #333333 25% 50%)',
        backgroundSize: '20px 20px',
      }}
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        dragDepthRef.current += 1
        setIsDraggingFile(true)
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => {
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0) setIsDraggingFile(false)
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        dragDepthRef.current = 0
        setIsDraggingFile(false)
        onFiles(e.dataTransfer.files)
      }}
    >
      {isDraggingFile && (
        <div className="bg-blue-950/80 pointer-events-none absolute inset-0 z-10 grid place-items-center border-2 border-dashed border-blue-300 text-xl text-white">
          Drop an SVG file to optimize
        </div>
      )}
      {children}
    </div>
  )
}

function SvgFileInput({
  onFiles,
  error,
}: {
  onFiles: (files: FileList) => void
  error: string | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <button
        type="button"
        className="w-full cursor-pointer px-4 py-3 text-left hover:bg-dark-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-300"
        onClick={() => fileInputRef.current?.click()}
      >
        Open SVG
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        hidden
        onChange={(e) => {
          if (e.currentTarget.files?.length) {
            onFiles(e.currentTarget.files)
          }
          e.currentTarget.value = ''
        }}
      />
      <p className="px-4 pb-3 text-sm text-light-gray-800">Or drop an SVG file anywhere.</p>
      <p className="px-4 text-sm text-red-300" aria-live="polite">
        {error}
      </p>
    </>
  )
}

function CopyButton({ children, text }: { children?: React.ReactNode; text: string }) {
  const [copied, setCopied] = useAutoResetState(false, 2_000)

  return (
    <button
      onClick={() => {
        if (!text) {
          return
        }

        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
        })
      }}
    >
      {copied ? <CarbonCheckmark width={14} height={14} /> : <CarbonCopy width={14} height={14} />}
      {children}
    </button>
  )
}

function SizeCompare(props: { originalSvg: string; optimizedSvg: string }) {
  const originalSize = useMemo(() => new Blob([props.originalSvg]).size, [props.originalSvg])
  const optimizedSize = useMemo(() => new Blob([props.optimizedSvg]).size, [props.optimizedSvg])

  return (
    <span className="w-max">
      <span>{formatBytes(originalSize)}</span>
      {' → '}
      <span>{formatBytes(optimizedSize)}</span>{' '}
      <span className="text-light-gray-800">
        ({((optimizedSize / originalSize) * 100).toFixed(2)}%)
      </span>
    </span>
  )
}

// TODO: use single quotes and do not encode unreserved characters e.g. whitespace
// https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function dataUrlToSvg(dataUrl: string): string {
  return decodeURIComponent(dataUrl.slice('data:image/svg+xml,'.length))
}

function optimizeJsonObject(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(optimizeJsonObject)
  }

  if (typeof value === 'object' && value !== null) {
    const optimizedObject: JsonObject = {}

    for (const key in value) {
      optimizedObject[key] = optimizeJsonObject(value[key])
    }

    return optimizedObject
  }

  if (typeof value === 'string') {
    if (value.startsWith('<svg')) {
      // 如果是 SVG 字符串，执行优化
      return optimizeSvg(value, { pretty: false }).data
    }

    if (value.startsWith('data:image/svg+xml,')) {
      // 如果是 data url，提取出 SVG 字符串后执行优化
      return optimizeSvgToDataUri(dataUrlToSvg(value))
    }
  }

  return value
}

function createDimensionsExtractor(dimensions: { width: number; height: number }) {
  const plugin: CustomPlugin = {
    name: 'extract-dimensions',
    fn(root, params, info) {
      if (info.multipassCount > 0) {
        return null
      }

      return {
        element: {
          // Node, parentNode
          enter({ name, attributes }, { type }) {
            if (!(name === 'svg' && type === 'root')) {
              return
            }

            if (attributes.width !== undefined && attributes.height !== undefined) {
              dimensions.width = Number.parseFloat(attributes.width)
              dimensions.height = Number.parseFloat(attributes.height)
            } else if (attributes.viewBox !== undefined) {
              const viewBox = attributes.viewBox.split(/,\s*|\s+/)
              dimensions.width = Number.parseFloat(viewBox[2])
              dimensions.height = Number.parseFloat(viewBox[3])
            }
          },
        },
      }
    },
  }

  return plugin
}

function optimizeSvg(value: string, options: { pretty?: boolean; datauri?: DataUri } = {}) {
  // https://github.com/svg/svgo/issues?q=is%3Aissue%20state%3Aopen%20foreignObject
  if (value.includes('<foreignObject')) {
    console.warn('SVG contains <foreignObject>, which may not be supported by SVGO properly.')
    return {
      data: options.datauri === 'enc' ? svgToDataUrl(value) : value,
      dimensions: { width: 0, height: 0 },
    }
  }

  const dimensions = { width: 0, height: 0 }
  const dimensionsPlugin = createDimensionsExtractor(dimensions)

  const { pretty = true, datauri } = options

  const { data } = optimize(value, {
    multipass: true,
    js2svg: {
      pretty,
      indent: 2,
      eol: 'lf',
      finalNewline: pretty,
      // Use single quotes to reduce size
      // https://github.com/svg/svgo/issues/617
      ...(datauri === 'enc' && {
        attrStart: "='",
        attrEnd: "'",
      }),
    },
    plugins: [
      {
        name: 'removeAttrs',
        params: {
          // data-figma-skip-parse
          // data-figma-gradient-fill
          attrs: 'data-figma-.*',
        },
      },
      'removeTitle',
      'removeScripts',
      'preset-default',
      dimensionsPlugin,
    ],
    datauri,
  })

  return { data, dimensions }
}

function optimizeSvgToDataUri(value: string): string {
  return optimizeSvg(value, { pretty: false, datauri: 'enc' }).data
}
