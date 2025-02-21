import { builtinPlugins, optimize, VERSION } from 'svgo/browser'

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
        <div className="cursor-pointer hover:bg-dark-gray-400 py-3 px-4">Paste markup</div>
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
