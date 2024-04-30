const testString =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel rhoncus nisl. Nunc accumsan ornare augue, et efficitur orci. Ut. `

export default function CSSPage() {
  return (
    <div>
      <div className="py-[1em] text-sm resizable-x w-[800px] max-w-full">
        <EllipsisMiddle text={testString} />
      </div>

      <div>
        <Subgrid />
      </div>
    </div>
  )
}

/**
 * Text ellipsis at the center of the element
 *
 * ref: https://codepen.io/xboxyan/pen/VwpPNbm
 */
function EllipsisMiddle({ text }: {
  text: string
}) {
  return (
    <div className="relative leading-[2em] h-[2em] bg-dark-gray-700 overflow-clip">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative top-[-4em] bg-inherit flex" title={text}>
        {/* Left part */}
        <div className="w-1/2 overflow-hidden whitespace-nowrap text-ellipsis">{text}</div>

        {/* Right part */}
        <div
          className="w-1/2 overflow-hidden whitespace-nowrap"
          dir="rtl"
          style={{ textOverflow: `""` }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function Subgrid() {
  return (
    <div
      className="grid min-w-[400px] w-max gap-x-2 gap-y-2"
      style={{
        // main-start icon[20px] text[max-content] main-end
        gridTemplateColumns:
          '[main-start] 1fr [icon-start] 20px [icon-end text-start] max-content [text-end] 1fr [main-end]',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-subgrid border border-solid border-green-600"
          style={{ gridColumn: 'main' }}
        >
          <div
            className="bg-blue-500 rounded-full size-[20px]"
            style={{ gridColumn: 'icon' }}
          >
          </div>

          <div style={{ gridColumn: 'text' }}>
            {'A'.repeat(i + 1)}
          </div>
        </div>
      ))}
    </div>
  )
}
