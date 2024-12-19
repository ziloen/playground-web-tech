const testString =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vel rhoncus nisl. Nunc accumsan ornare augue, et efficitur orci. Ut. `

export default function CSSPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-[800px] max-w-full text-sm resizable-x">
        <EllipsisMiddle text={testString} />
      </div>
      <div className="w-[750px] max-w-full text-sm resizable-x">
        <ShowMore text={testString} />
      </div>

      <div>
        <Subgrid />
      </div>

      <div>
        <HolyGrail />
      </div>

      <AspectRatio />

      <SameWidthFlexWrap />

      <AutoShrinkButton />

      <AutoShrinkButton2 />

      <AutoShrinkButton3 />

      <FlexAlignFirstLine />

      <GridRepeat />

      <SizeConstraints />
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
    <div className="relative h-[2em] overflow-clip bg-dark-gray-700 leading-[2em]">
      {/* When not overflow */}
      <div className="max-h-[4em] w-fit">{text}</div>

      {/* When overflow, this will cover above text */}
      <div className="relative -top-[4em] flex bg-inherit" title={text}>
        {/* Left part */}
        <div className="w-1/2 overflow-hidden text-ellipsis whitespace-nowrap">{text}</div>

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
      className="grid w-max min-w-[400px] gap-x-2 gap-y-2"
      style={{
        // main-start[1fr] icon[20px] text[max-content] main-end[1fr]
        gridTemplateColumns:
          '[main-start] 1fr [icon-start] 20px [icon-end text-start] max-content [text-end] 1fr [main-end]',
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="col-[main] grid grid-cols-subgrid border border-solid border-green-600"
        >
          <div className="col-[icon] size-[20px] rounded-full bg-blue-500"></div>

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
      <div className="bg-green-600/15 me-auto">Looooooooooooong text</div>

      <div className="mx-auto bg-violet-300/30">Center Title</div>

      <div className="flex ms-auto bg-red-700/15">Short text</div>
    </div>
  )
}

/**
 * Two item with same width, when any element reach max-content width, it will wrap to next line
 */
function SameWidthFlexWrap() {
  return (
    <div className="flex w-[300px] flex-wrap gap-[12px] bg-dark-gray-700 resizable-x">
      <div
        className="shrink-0 grow whitespace-nowrap bg-blue-400/20 text-center"
        style={{
          flexBasis: 'calc(50% - 6px)',
          width: 'fit-content',
        }}
      >
        Lorem ipsum
      </div>

      <div
        className="shrink-0 grow whitespace-nowrap bg-green-400/20 text-center"
        style={{
          flexBasis: 'calc(50% - 6px)',
          width: 'fit-content',
        }}
      >
        dolor
      </div>
    </div>
  )
}

function AspectRatio() {
  return (
    <div className="flex">
      {/* Works on Firefox */}
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-light-gray-900 resizable">
        <div className="m-auto aspect-video max-h-full max-w-full bg-green-900 w-stretch">
          Only works on Firefox
        </div>
      </div>

      {/* Works on All */}
      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-dark-gray-600 resizable">
        {/* viewBox or el.getBBox() */}
        <svg viewBox="0 0 300 200" className="max-w-full max-h-full m-auto">
          <image href="https://dummyimage.com/300x200/554d3e/ffffff.png&text=300x200 SVG" />
        </svg>
      </div>

      <div className="flex size-[100px] min-h-[40px] min-w-[40px] bg-light-gray-900 resizable">
        <div className="relative m-auto aspect-video max-h-full min-h-0 min-w-0 max-w-full overflow-clip bg-green-900">
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
      <div className="relative overflow-hidden bg-dark-gray-700 leading-[2em]">
        <span>{text}</span>

        <span className="pointer-events-none float-end ml-2 inline-block text-transparent">
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
      <div className="relative -top-[4em] bg-inherit flex" title={text}>
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

function AutoShrinkButton() {
  return (
    <div className="text-sm resizable-x w-[300px] max-w-full flex gap-2 bg-dark-gray-700">
      <div className="flex-1 h-[1lh]">
        <div className="bg-blue-400/20 gap-x-2 px-2 flex flex-wrap max-h-[2lh] max-w-max">
          <div className="h-[1lh]">
            🏐
          </div>

          <div className="break-all">
            Button 1
          </div>
        </div>

        <div className="relative -top-[2lh] flex bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">
            🏀
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-green-400/20 px-2">Button 2</div>

      <div className="bg-red-400/20 shrink-0 px-2">Button 3</div>
    </div>
  )
}

function AutoShrinkButton2() {
  return (
    <div className="flex w-[450px] max-w-full gap-2 bg-dark-gray-700 text-sm resizable-x">
      <div className="mr-auto h-[1lh]">
        <div className="flex gap-2 overflow-hidden">
          <div className="flex max-h-[2lh] max-w-max flex-wrap gap-x-2 bg-blue-400/20 px-2">
            <div className="h-[1lh]">
              🏐
            </div>

            <div className="break-all">
              Button 1
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <div className="shrink-0 whitespace-nowrap bg-green-400/20 px-2">Button 2</div>

            <div className="shrink-0 whitespace-nowrap bg-red-400/20 px-2">Button 3</div>
          </div>
        </div>

        <div className="relative -top-[2lh] flex gap-2 bg-dark-gray-700">
          <div className="bg-blue-400/20 px-2">
            🏀
          </div>

          <div className="shrink-0 bg-green-400/20 px-2">Button 2</div>

          <div className="shrink-0 bg-red-400/20 px-2">Button 3</div>
        </div>
      </div>

      <div className="shrink-0 bg-violet-400/20 px-2">Button 4</div>

      <div className="shrink-0 bg-orange-400/20 px-2">Button 5</div>
    </div>
  )
}

function AutoShrinkButton3() {
  return (
    <div className="text-sm w-[100px] resizable-x max-w-full flex gap-2">
      <div className="h-[1lh]">
        <div className="relative flex flex-row flex-wrap-reverse">
          <div className="h-[1lh] shrink-0">Button</div>
          <div className="w-px h-[1lh]"></div>

          <div className="absolute bottom-[1lh] shrink-0 whitespace-nowrap">
            AAAA djaiowjdoi
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * https://stackoverflow.com/questions/32118013/align-icon-vertically-to-the-center-of-the-first-line-of-text
 */
function FlexAlignFirstLine() {
  return (
    <div className="flex">
      WIP
    </div>
  )
}

function GridRepeat() {
  return (
    <div className="resizable-x @container">
      <div
        className={clsx(
          'grid gap-2',
          // items
          '[&>div]:bg-red-300',
          // titles
          '[&>span]:bg-blue-300 [&>span]:justify-self-start',
          // default
          'grid-cols-[--template-columns]',
          // at least 2 items, when width <= item-min-width * 2 + gap * 1
          '@[<=408px]:grid-cols-[--sm-template-columns]',
        )}
        style={{
          '--item-min-width': '200px',
          '--template-columns': 'repeat(auto-fit, minmax(min(var(--item-min-width), 100%), 1fr))',
          '--sm-template-columns': '1fr 1fr',
        }}
      >
        <span className="col-span-full">Title1</span>
        <div className="">111</div>
        <span className="col-span-full">Title2</span>
        <div className="">111</div>
        <div className="">222</div>
        <span className="col-span-full">Title3</span>
        <div className="">111</div>
        <div className="">222</div>
        <div className="">333</div>
        <span className="col-span-full">Title4</span>
        <div className="">111</div>
        <div className="">222</div>
        <div className="">333</div>
        <div className="">444</div>
      </div>
    </div>
  )
}

function SizeConstraints() {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [width, setWidth] = useState(100)

  return (
    <div
      className="size-[300px] bg-dark-gray-500 ms-4 relative"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const relativeX = e.clientX - rect.left
        const relativeY = e.clientY - rect.top
        setLeft(relativeX)
        setTop(relativeY)
      }}
    >
      <div
        className="absolute bg-red-400"
        style={{
          minWidth: '50px',
          minHeight: '50px',
          left: `${left}px`,
          top: `${top}px`,
          right: `max(100% - ${left + width}px, 0px)`,
          bottom: `max(100% - ${top + width}px, 0px)`,
        }}
      />
    </div>
  )
}
