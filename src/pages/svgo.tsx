import { forOwn } from 'es-toolkit/compat'
import type { CustomPlugin } from 'svgo/browser'
import { builtinPlugins, optimize, VERSION } from 'svgo/browser'
import type { JsonObject, JsonValue } from 'type-fest'
import { useAutoResetState } from '~/hooks'
import CarbonCheckmark from '~icons/carbon/checkmark'
import CarbonCopy from '~icons/carbon/copy'

export default function SVGOPage() {
  // #region useState, useHookState
  const [svgStr, setSvgStr] = useState<string | null>(null)
  const [svgUri, setSvgUri] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const [copied, setCopied] = useAutoResetState(false, 2_000)
  // #endregion

  // #region useRef
  // #endregion

  // #region useMemo
  // #endregion

  // #region functions, useImperativeHandle
  // #endregion

  // #region useHookEffect, useEffect
  // #endregion

  return (
    <div
      className="flex h-full"
      style={{
        backgroundImage: 'repeating-conic-gradient(#3b3b3b 0% 25%, #333333 0% 50%)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Left side menus */}
      <div className="w-60 bg-dark-gray-300 h-full">
        <div className="px-4 py-1">Powered by SVGO {VERSION}</div>
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
                  const json = JSON.parse(value) as JsonValue

                  const optimizedJson = optimizeJsonObject(json)
                  console.info('Optimized JSON:', optimizedJson)
                } catch (error) {
                  console.error('Invalid JSON input:', error)
                }
              }

              if (value.startsWith('<svg')) {
                // SVG input
                try {
                  const { data: optimizedSvg, dimensions } = optimizeSvg(value, true)
                  setSvgStr(optimizedSvg)
                  setDimensions(dimensions)
                  setSvgUri(svgToDataUri(optimizedSvg))
                } catch (error) {
                  console.error('Invalid SVG input:', error)
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
              setSvgStr(v.default)
              setSvgUri(svgToDataUri(v.default))
              setDimensions({ width: 32, height: 32 })
            })
          }}
        >
          Demo
        </div>
      </div>

      {/* SVG preview */}
      <div
        className="flex-1 grid place-items-center"
        style={{
          // make the iframe transparent
          // https://fvsch.com/transparent-iframes
          colorScheme: 'light',
        }}
      >
        <iframe
          src={svgUri || 'about:blank'}
          frameBorder="0"
          title="SVG preview"
          scrolling="no"
          className="bg-transparent border-none overflow-hidden"
          style={{
            width: dimensions.width ? `${dimensions.width}px` : '100%',
            height: dimensions.height ? `${dimensions.height}px` : '100%',
          }}
        />
      </div>

      {/* Right side menus */}
      <div className={clsx('relative', svgStr ? 'block' : 'hidden')}>
        <div className="absolute right-0 bottom-0">
          {/* Copy text */}
          <button
            onClick={() => {
              if (!svgStr) {
                return
              }

              navigator.clipboard.writeText(svgStr).then(() => {
                setCopied(true)
              })
            }}
          >
            {copied
              ? <CarbonCheckmark width={14} height={14} />
              : <CarbonCopy width={14} height={14} />}
          </button>

          {/* Download svg */}
          {!!svgUri && <a href={svgUri} download="image.svg">Download</a>}
        </div>
      </div>
    </div>
  )
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * 深度递归将所有 value 为 svg 字符串的属性执行 svgo
 */
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

  if (typeof value === 'string' && value.startsWith('<svg')) {
    // 如果是 SVG 字符串，执行优化
    return optimizeSvg(value, false).data
  }

  return value
}

function createDimensionsExtractor() {
  const dimensions = { width: 0, height: 0 }

  const plugin: CustomPlugin = {
    name: 'extract-dimensions',
    fn() {
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

  return [dimensions, plugin] as const
}

function optimizeSvg(value: string, pretty = true) {
  const [dimensions, dimensionsPlugin] = createDimensionsExtractor()

  const data = optimize(value, {
    multipass: true,
    js2svg: {
      pretty: pretty,
      indent: 2,
    },
    plugins: [
      'removeTitle',
      'removeScripts',
      'preset-default',
      dimensionsPlugin,
    ],
  }).data

  return { data, dimensions }
}
