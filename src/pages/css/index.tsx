const testString =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel rhoncus nisl. Nunc accumsan ornare augue, et efficitur orci. Ut. `

export default function CSSPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm resizable-x w-[800px] max-w-full">
        <EllipsisMiddle text={testString} />
      </div>
      <div className="text-sm resizable-x w-[750px] max-w-full">
        <ShowMore text={testString} />
      </div>

      <div>
        <Subgrid />
      </div>

      <div>
        <HolyGrail />
      </div>

      <AspectRatio />
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
          className="col-[main] grid grid-cols-subgrid border border-solid border-green-600"
        >
          <div className="col-[icon] bg-blue-500 rounded-full size-[20px]"></div>

          <div className="col-[text]">{'A'.repeat(i + 1)}</div>
        </div>
      ))}
    </div>
  )
}

function HolyGrail() {
  return (
    <div
      className="grid max-w-[600px] bg-dark-gray-600"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      <div className="bg-green-600/15">Looooooooooooong text</div>

      <div className="">Center Title</div>

      <div className="flex justify-end bg-red-700/15">Short text</div>
    </div>
  )
}

function AspectRatio() {
  return (
    <div className="flex">
      {/* Works on Firefox */}
      <div className="resizable min-h-[40px] min-w-[40px] flex bg-light-gray-900 size-[100px]">
        <div className="bg-green-900 w-stretch aspect-video max-w-full max-h-full m-auto">
          Only works on Firefox
        </div>
      </div>

      {/* Works on All */}
      <div className="resizable min-h-[40px] min-w-[40px] bg-dark-gray-600 size-[100px] flex">
        {/* viewBox or el.getBBox() */}
        <svg viewBox="0 0 300 200" className="max-w-full max-h-full m-auto">
          <image href="https://dummyimage.com/300x200/554d3e/ffffff.png&text=300x200 SVG" />
        </svg>
      </div>

      <div className="resizable min-h-[40px] min-w-[40px] flex bg-light-gray-900 size-[100px]">
        <div className="bg-green-900 min-h-0 min-w-0 overflow-clip aspect-video max-w-full max-h-full m-auto relative">
          <div className="size-[99999px]">
            Hack
          </div>
        </div>
      </div>
    </div>
  )
}

function ShowMore({ text }: {
  text: string
}) {
  const [isShowMore, setIsShowMore] = useState(false)

  if (isShowMore) {
    return (
      <div className="relative bg-dark-gray-700 leading-[2em] overflow-hidden">
        <span>{text}</span>

        <span className="inline-block text-transparent float-end ml-2 pointer-events-none">
          Show less
        </span>

        <div
          className="absolute bottom-0 cursor-pointer text-purple-400 right-2"
          onClick={() => setIsShowMore(false)}
          style={{
            top: `max(1lh, calc(100% - 1lh))`,
          }}
        >
          Show less
        </div>
      </div>
    )
  }

  return (
    <div className="relative leading-[2em] h-[1lh] bg-dark-gray-700">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit overflow-visible">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative top-[-4em] bg-inherit flex" title={text}>
        {/* Left part */}
        <div
          className="overflow-hidden whitespace-nowrap text-ellipsis"
          style={{
            maskImage: 'linear-gradient(to left, transparent, black 10em)',
          }}
        >
          {text}
        </div>

        {/* Right part */}
        <div
          className="w-max cursor-pointer ml-2 text-purple-400 shrink-0"
          onClick={() => setIsShowMore((prev) => !prev)}
        >
          Show more
        </div>
      </div>
    </div>
  )
}

function ScrollAutoAnchor() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div className="flex flex-col-reverse overflow-y-auto">
        <div className="mt-auto"></div>

        <div>
          <div></div>

          {Array.from({ length: count }).map((_, index) => {
            return <div key={null}>Item</div>
          })}
        </div>
      </div>
    </div>
  )
}
