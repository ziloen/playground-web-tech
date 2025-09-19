import JSON5 from 'json5'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import type { CustomPlugin, DataUri } from 'svgo/browser'
import { builtinPlugins, optimize, VERSION } from 'svgo/browser'
import type { JsonObject, JsonValue } from 'type-fest'
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
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const [copied, setCopied] = useAutoResetState(false, 2_000)
  // #endregion

  // #region useRef
  const transformWrapperRef = useRef<ComponentRef<typeof TransformWrapper>>(null)
  // #endregion

  // #region useMemo
  // #endregion

  // #region functions, useImperativeHandle
  // #endregion

  // #region useHookEffect, useEffect
  useEffect(() => {
    Reflect.set(window, 'optimizeSvg', optimizeSvg)
  }, [])
  // #endregion

  return (
    <div
      className="flex h-full"
      style={{
        backgroundImage: 'repeating-conic-gradient(#3b3b3b 0% 25%, #333333 0% 50%)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* TODO: support drop svg file */}
      {/* Left side menus */}
      <div className="w-60 bg-dark-gray-300 h-full">
        <div className="px-4 py-1">
          Powered by <a href="https://github.com/svg/svgo" target="_blank" rel="noreferrer">SVGO</a>
          {' '}
          {VERSION}
        </div>
        <div className="cursor-pointer hover:bg-dark-gray-400 py-3 px-4">Open SVG</div>
        <label className="cursor-pointer hover:bg-dark-gray-400 py-3 px-4 grid">
          <textarea
            className="col-[1/1] row-[1/1] peer bg-transparent resize-none border-none h-lh font-[inherit] text-inherit placeholder:text-inherit focus:outline-none"
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
                  const { data: optimizedSvg, dimensions } = optimizeSvg(value, { pretty: true })
                  setOriginalSvg(value)
                  setOptimizedSvg(optimizedSvg)
                  setDimensions(dimensions)
                  setSvgUri(optimizeSvgToDataUri(value))
                  transformWrapperRef.current?.resetTransform()
                } catch (error) {
                  console.error('Invalid SVG input:', error)
                }
              } else if (value.startsWith('data:image/svg+xml,')) {
                // Data URL input
                try {
                  const svgString = decodeURIComponent(value.slice('data:image/svg+xml,'.length))
                  const { data: optimizedSvg, dimensions } = optimizeSvg(svgString, {
                    pretty: true,
                  })
                  setOriginalSvg(svgString)
                  setOptimizedSvg(optimizedSvg)
                  setDimensions(dimensions)
                  setSvgUri(optimizeSvgToDataUri(svgString))
                  transformWrapperRef.current?.resetTransform()
                } catch (error) {
                  console.error('Invalid SVG data URL input:', error)
                }
              }
            }}
          />
          <span className="col-[1/1] row-[1/1] peer-focus:hidden">
            Paste markup
          </span>
        </label>
        <div
          className="cursor-pointer hover:bg-dark-gray-400 py-3 px-4"
          onClick={() => {
            import('../assets/figma.svg?raw').then((v) => {
              const { data: optimizedSvg, dimensions } = optimizeSvg(v.default, { pretty: true })

              setOriginalSvg(v.default)
              setOptimizedSvg(optimizedSvg)
              setSvgUri(optimizeSvgToDataUri(v.default))
              transformWrapperRef.current?.resetTransform()
              setDimensions(dimensions)
            })
          }}
        >
          Demo
        </div>
      </div>

      {/* TODO: configuration */}

      {/* SVG preview */}
      <TransformWrapper
        ref={transformWrapperRef}
        maxScale={10}
        panning={{
          velocityDisabled: true,
        }}
        limitToBounds={false}
      >
        <TransformComponent
          wrapperStyle={{
            // make the iframe transparent
            // https://fvsch.com/transparent-iframes
            colorScheme: 'light',
            height: '100%',
            flex: '1',
          }}
          contentStyle={{
            height: '100%',
            width: '100%',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {/* TODO: Add text color: white to iframe */}
          <iframe
            src={svgUri || 'about:blank'}
            frameBorder="0"
            title="SVG preview"
            scrolling="no"
            className="bg-transparent border-none overflow-hidden pointer-events-none"
            style={{
              width: dimensions.width ? `${dimensions.width}px` : '100%',
              height: dimensions.height ? `${dimensions.height}px` : '100%',
            }}
          />
        </TransformComponent>
      </TransformWrapper>

      {/* Right side menus */}
      <div className={clsx('relative', optimizedSvg ? 'block' : 'hidden')}>
        <div className="absolute right-0 bottom-0 grid justify-items-end">
          {!!originalSvg && !!optimizedSvg && (
            <SizeCompare
              originalSvg={originalSvg}
              optimizedSvg={optimizedSvg}
            />
          )}

          {/* Copy text */}
          {!!optimizedSvg && (
            <CopyButton text={optimizedSvg}>
            </CopyButton>
          )}

          {/* Download svg */}
          {!!svgUri && (
            <>
              {/* Copy as data url */}
              <CopyButton text={svgUri}>
                data URL
              </CopyButton>

              <a href={svgUri} download="image.svg">Download</a>
            </>
          )}
        </div>
      </div>
    </div>
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
      {copied
        ? <CarbonCheckmark width={14} height={14} />
        : <CarbonCopy width={14} height={14} />}
      {children}
    </button>
  )
}

function SizeCompare(
  props: {
    originalSvg: string
    optimizedSvg: string
  },
) {
  const originalSize = useMemo(() => new Blob([props.originalSvg]).size, [props.originalSvg])
  const optimizedSize = useMemo(() => new Blob([props.optimizedSvg]).size, [props.optimizedSvg])

  return (
    <span className="w-max">
      <span>{formatBytes(originalSize)}</span>
      {' → '}
      <span>{formatBytes(optimizedSize)}</span>{' '}
      <span className="text-light-gray-800">
        ({((optimizedSize / originalSize) * 100).toFixed(
          2,
        )}%)
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
    } else if (value.startsWith('data:image/svg+xml,')) {
      // 如果是 data url，提取出 SVG 字符串后执行优化
      return optimizeSvgToDataUri(dataUrlToSvg(value))
    }
  }

  return value
}

function createDimensionsExtractor(dimensions: {
  width: number
  height: number
}) {
  const plugin: CustomPlugin = {
    name: 'extract-dimensions',
    fn(root, params, info) {
      return {
        element: {
          // Node, parentNode
          enter({ name, attributes }, { type }) {
            if (!(name === 'svg' && type === 'root')) {
              return
            }

            if (
              attributes.width !== undefined
              && attributes.height !== undefined
            ) {
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

function optimizeSvg(
  value: string,
  options: { pretty?: boolean; datauri?: DataUri } = {},
) {
  const dimensions = { width: 0, height: 0 }
  const dimensionsPlugin = createDimensionsExtractor(dimensions)

  const { pretty = true, datauri = undefined } = options

  const { data } = optimize(value, {
    multipass: true,
    js2svg: {
      pretty,
      indent: 2,
      eol: 'lf',
      // Use single quotes to reduce size
      // https://github.com/svg/svgo/issues/617
      ...(datauri === 'enc' && {
        attrStart: "='",
        attrEnd: "'",
      }),
    },
    plugins: [
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
