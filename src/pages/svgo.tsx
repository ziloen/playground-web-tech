import { forOwn } from 'lodash-es'
import { builtinPlugins, optimize, VERSION } from 'svgo/browser'
import type { JsonObject, JsonValue } from 'type-fest'

export default function SVGOPage() {
  // #region useState, useHookState
  const [svgStr, setSvgStr] = useState<string | null>(null)
  const [svgUri, setSvgUri] = useState<string | null>(null)
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
            }}
          >
          </textarea>
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
            })
          }}
        >
          Demo
        </div>
      </div>

      {/* SVG preview */}
      <div>
        <div
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
          >
          </iframe>
        </div>
      </div>

      {/* Right side menus */}
      <div>
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
    return optimizeSvg(value)
  }

  return value
}

function optimizeSvg(value: string): string {
  return optimize(value, { multipass: true }).data
}
